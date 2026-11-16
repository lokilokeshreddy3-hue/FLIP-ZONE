import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    create_engine,
    select,
    func,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    Session,
    mapped_column,
    relationship,
    sessionmaker,
)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flipzone.db")
JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "local-development-secret-change-before-deploy"
)
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

engine_args = (
    {"connect_args": {"check_same_thread": False}}
    if DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(DATABASE_URL, **engine_args)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


# =========================================================
# DATABASE MODELS
# =========================================================

class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    cart: Mapped[Optional["Cart"]] = relationship(
        back_populates="user",
        uselist=False,
    )

    orders: Mapped[list["Order"]] = relationship(
        back_populates="user",
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(160),
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(80),
        index=True,
    )

    description: Mapped[str] = mapped_column(Text)

    sku: Mapped[str] = mapped_column(
        String(40),
        unique=True,
    )

    price: Mapped[int] = mapped_column(Integer)
    old_price: Mapped[int] = mapped_column(Integer)

    rating: Mapped[float] = mapped_column(
        Float,
        default=4.5,
    )

    image_url: Mapped[str] = mapped_column(
        String(500),
        default="",
    )

    emoji: Mapped[str] = mapped_column(
        String(12),
        default="🛍️",
    )

    badge: Mapped[str] = mapped_column(
        String(40),
        default="",
    )

    stock: Mapped[int] = mapped_column(
        Integer,
        default=20,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped[User] = relationship(
        back_populates="cart",
    )

    items: Mapped[list["CartItem"]] = relationship(
        back_populates="cart",
        cascade="all, delete-orphan",
    )


class CartItem(Base):
    __tablename__ = "cart_items"

    __table_args__ = (
        UniqueConstraint("cart_id", "product_id"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    cart_id: Mapped[int] = mapped_column(
        ForeignKey("carts.id"),
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
    )

    quantity: Mapped[int] = mapped_column(Integer)

    cart: Mapped[Cart] = relationship(
        back_populates="items",
    )

    product: Mapped[Product] = relationship()


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="placed",
    )

    subtotal: Mapped[int] = mapped_column(Integer)

    shipping_fee: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    total: Mapped[int] = mapped_column(Integer)

    currency: Mapped[str] = mapped_column(
        String(3),
        default="INR",
    )

    shipping_address: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    user: Mapped[User] = relationship(
        back_populates="orders",
    )

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"),
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
    )

    product_name_snapshot: Mapped[str] = mapped_column(
        String(160),
    )

    unit_price_snapshot: Mapped[int] = mapped_column(Integer)
    quantity: Mapped[int] = mapped_column(Integer)
    line_total: Mapped[int] = mapped_column(Integer)

    order: Mapped[Order] = relationship(
        back_populates="items",
    )


# Create database tables.
Base.metadata.create_all(bind=engine)

password_hasher = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)


# =========================================================
# DATABASE DEPENDENCY
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# AUTHENTICATION HELPERS
# =========================================================

def user_dict(user: User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
    }


def make_token(user: User):
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user.id),
        "iat": now,
        "exp": now + timedelta(
            minutes=JWT_EXPIRE_MINUTES
        ),
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = int(payload["sub"])

    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token",
        )

    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user


# =========================================================
# REQUEST SCHEMAS
# =========================================================

class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class CartAddIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=100)


class CartUpdateIn(BaseModel):
    quantity: int = Field(ge=1, le=100)


class ShippingAddress(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=15)
    address: str = Field(min_length=5, max_length=300)
    city: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(min_length=4, max_length=12)


class OrderLineIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=100)


class CheckoutIn(BaseModel):
    shipping_address: ShippingAddress
    items: list[OrderLineIn] = Field(min_length=1)


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="Flip Zone API",
    version="1.0.0",
    description="Backend API for Flip Zone e-commerce application",
)


# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# PRODUCT SEEDING
# =========================================================

@app.on_event("startup")
def seed_products():
    with SessionLocal() as db:

        product_count = db.scalar(
            select(func.count(Product.id))
        )

        if product_count == 0:

            seed = [
                (
                    "Noise-cancelling Headphones",
                    "Electronics",
                    "Comfortable wireless headphones with rich sound, clear calls and long battery life.",
                    "FZ-ELE-001",
                    3499,
                    4999,
                    4.7,
                    "🎧",
                    "Best seller",
                    25,
                ),
                (
                    "Smart Fitness Watch",
                    "Electronics",
                    "Track daily activity, workouts and notifications with a bright display.",
                    "FZ-ELE-002",
                    2299,
                    3299,
                    4.5,
                    "⌚",
                    "Popular",
                    30,
                ),
                (
                    "Everyday Running Shoes",
                    "Fashion",
                    "Lightweight everyday shoes designed for comfort and dependable grip.",
                    "FZ-FAS-001",
                    1899,
                    2799,
                    4.4,
                    "👟",
                    "New",
                    40,
                ),
                (
                    "Minimal Desk Lamp",
                    "Home",
                    "A clean, modern desk lamp for reading, studying and working.",
                    "FZ-HOM-001",
                    999,
                    1499,
                    4.3,
                    "💡",
                    "",
                    20,
                ),
                (
                    "Travel Backpack",
                    "Fashion",
                    "A practical backpack with organised storage for everyday travel.",
                    "FZ-FAS-002",
                    1499,
                    2199,
                    4.6,
                    "🎒",
                    "Deal",
                    35,
                ),
                (
                    "Ceramic Coffee Set",
                    "Home",
                    "A simple ceramic set to make your coffee moments better.",
                    "FZ-HOM-002",
                    799,
                    1199,
                    4.2,
                    "☕",
                    "",
                    18,
                ),
                (
                    "Portable Bluetooth Speaker",
                    "Electronics",
                    "Compact speaker with punchy sound for home and outdoor listening.",
                    "FZ-ELE-003",
                    1599,
                    2299,
                    4.5,
                    "🔊",
                    "Trending",
                    22,
                ),
                (
                    "Skin Care Essentials Kit",
                    "Beauty",
                    "A daily care bundle for a simple and refreshing routine.",
                    "FZ-BEA-001",
                    1199,
                    1699,
                    4.4,
                    "🧴",
                    "",
                    15,
                ),
            ]

            products = [
                Product(
                    name=name,
                    category=category,
                    description=description,
                    sku=sku,
                    price=price,
                    old_price=old_price,
                    rating=rating,
                    emoji=emoji,
                    badge=badge,
                    stock=stock,
                    image_url="",
                )
                for (
                    name,
                    category,
                    description,
                    sku,
                    price,
                    old_price,
                    rating,
                    emoji,
                    badge,
                    stock,
                ) in seed
            ]

            db.add_all(products)
            db.commit()


# =========================================================
# GENERAL ROUTES
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Flip Zone API is running",
        "docs": "/docs",
    }


@app.get("/api/v1/health")
def health():
    return {
        "status": "healthy",
        "service": "flip-zone-api",
    }


# =========================================================
# AUTHENTICATION ROUTES
# =========================================================

@app.post("/api/v1/auth/register", status_code=201)
def register(
    payload: RegisterIn,
    db: Session = Depends(get_db),
):
    email = payload.email.lower()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=password_hasher.hash(
            payload.password
        ),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "user": user_dict(user),
        "access_token": make_token(user),
        "token_type": "Bearer",
    }


@app.post("/api/v1/auth/login")
def login(
    payload: LoginIn,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(
            User.email == payload.email.lower()
        )
    )

    if not user or not password_hasher.verify(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    return {
        "user": user_dict(user),
        "access_token": make_token(user),
        "token_type": "Bearer",
    }


@app.get("/api/v1/auth/me")
def auth_me(
    user: User = Depends(get_current_user),
):
    return user_dict(user)


# =========================================================
# PRODUCT ROUTES
# =========================================================

def product_dict(product: Product):
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "price": product.price,
        "old_price": product.old_price,
        "oldPrice": product.old_price,
        "rating": product.rating,
        "image_url": product.image_url,
        "description": product.description,
        "stock": product.stock,
        "sku": product.sku,
        "emoji": product.emoji,
        "badge": product.badge,
    }


@app.get("/api/v1/products")
def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    sort: str = "featured",
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(Product).where(
        Product.is_active.is_(True)
    )

    if q:
        stmt = stmt.where(
            Product.name.ilike(f"%{q}%")
        )

    if category and category.lower() != "all":
        stmt = stmt.where(
            Product.category.ilike(category)
        )

    if sort == "price_asc":
        stmt = stmt.order_by(Product.price.asc())

    elif sort == "price_desc":
        stmt = stmt.order_by(Product.price.desc())

    else:
        stmt = stmt.order_by(Product.id.asc())

    total = db.scalar(
        select(func.count()).select_from(
            stmt.subquery()
        )
    ) or 0

    rows = db.scalars(
        stmt.offset((page - 1) * limit).limit(limit)
    ).all()

    return {
        "items": [
            product_dict(product)
            for product in rows
        ],
        "page": page,
        "limit": limit,
        "total": total,
    }


@app.get("/api/v1/products/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)

    if not product or not product.is_active:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return product_dict(product)


@app.get("/api/v1/categories")
def categories(
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(Product.category)
        .where(Product.is_active.is_(True))
        .distinct()
        .order_by(Product.category)
    ).all()

    return {
        "items": rows,
    }


# =========================================================
# CART HELPERS
# =========================================================

def get_or_create_cart(
    db: Session,
    user: User,
):
    cart = db.scalar(
        select(Cart).where(
            Cart.user_id == user.id
        )
    )

    if not cart:
        cart = Cart(user_id=user.id)

        db.add(cart)
        db.commit()
        db.refresh(cart)

    return cart


def cart_dict(
    db: Session,
    user: User,
):
    cart = get_or_create_cart(db, user)

    lines = db.scalars(
        select(CartItem).where(
            CartItem.cart_id == cart.id
        )
    ).all()

    items = []
    subtotal = 0

    for line in lines:
        product = db.get(
            Product,
            line.product_id,
        )

        if not product:
            continue

        line_total = product.price * line.quantity
        subtotal += line_total

        items.append({
            "id": line.id,
            "product_id": product.id,
            "product": product_dict(product),
            "name": product.name,
            "category": product.category,
            "price": product.price,
            "oldPrice": product.old_price,
            "rating": product.rating,
            "emoji": product.emoji,
            "badge": product.badge,
            "image_url": product.image_url,
            "quantity": line.quantity,
            "line_total": line_total,
        })

    return {
        "items": items,
        "subtotal": subtotal,
        "currency": "INR",
    }


# =========================================================
# CART ROUTES
# =========================================================

@app.get("/api/v1/cart")
def get_cart(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return cart_dict(db, user)


@app.post("/api/v1/cart/items")
def add_cart_item(
    payload: CartAddIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.get(
        Product,
        payload.product_id,
    )

    if not product or not product.is_active:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    cart = get_or_create_cart(db, user)

    line = db.scalar(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == product.id,
        )
    )

    new_quantity = (
        (line.quantity if line else 0)
        + payload.quantity
    )

    if new_quantity > product.stock:
        raise HTTPException(
            status_code=409,
            detail=f"Only {product.stock} item(s) are available",
        )

    if line:
        line.quantity = new_quantity

    else:
        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=payload.quantity,
            )
        )

    db.commit()

    return cart_dict(db, user)


@app.patch("/api/v1/cart/items/{item_id}")
def update_cart_item(
    item_id: int,
    payload: CartUpdateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = get_or_create_cart(db, user)

    line = db.scalar(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id,
        )
    )

    if not line:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found",
        )

    product = db.get(
        Product,
        line.product_id,
    )

    if payload.quantity > product.stock:
        raise HTTPException(
            status_code=409,
            detail=f"Only {product.stock} item(s) are available",
        )

    line.quantity = payload.quantity
    db.commit()

    return cart_dict(db, user)


@app.delete(
    "/api/v1/cart/items/{item_id}",
    status_code=204,
)
def delete_cart_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = get_or_create_cart(db, user)

    line = db.scalar(
        select(CartItem).where(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id,
        )
    )

    if not line:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found",
        )

    db.delete(line)
    db.commit()

    return None


# =========================================================
# CHECKOUT ROUTE
# =========================================================

@app.post("/api/v1/orders", status_code=201)
def create_order(
    payload: CheckoutIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        subtotal = 0
        resolved = []

        for requested in payload.items:

            product = db.get(
                Product,
                requested.product_id,
            )

            if not product or not product.is_active:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {requested.product_id} not found",
                )

            if requested.quantity > product.stock:
                raise HTTPException(
                    status_code=409,
                    detail=f"Insufficient stock for {product.name}",
                )

            line_total = (
                product.price * requested.quantity
            )

            subtotal += line_total

            resolved.append(
                (
                    product,
                    requested.quantity,
                    line_total,
                )
            )

        order = Order(
            user_id=user.id,
            status="placed",
            subtotal=subtotal,
            shipping_fee=0,
            total=subtotal,
            currency="INR",
            shipping_address=(
                payload.shipping_address.model_dump_json()
            ),
        )

        db.add(order)
        db.flush()

        for product, quantity, line_total in resolved:

            product.stock -= quantity

            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name_snapshot=product.name,
                    unit_price_snapshot=product.price,
                    quantity=quantity,
                    line_total=line_total,
                )
            )

        db.commit()
        db.refresh(order)

        cart = db.scalar(
            select(Cart).where(
                Cart.user_id == user.id
            )
        )

        if cart:
            db.query(CartItem).filter(
                CartItem.cart_id == cart.id
            ).delete()

            db.commit()

        return {
            "id": order.id,
            "status": order.status,
            "currency": order.currency,
            "subtotal": order.subtotal,
            "shipping_fee": order.shipping_fee,
            "total": order.total,
            "created_at": order.created_at.isoformat(),
        }

    except Exception:
        db.rollback()
        raise


# =========================================================
# ORDER HISTORY ROUTES
# =========================================================

@app.get("/api/v1/orders")
def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
    )

    total = db.scalar(
        select(func.count()).select_from(
            stmt.subquery()
        )
    ) or 0

    rows = db.scalars(
        stmt.offset((page - 1) * limit).limit(limit)
    ).all()

    return {
        "items": [
            {
                "id": order.id,
                "status": order.status,
                "total": order.total,
                "currency": order.currency,
                "created_at": order.created_at.isoformat(),
            }
            for order in rows
        ],
        "page": page,
        "limit": limit,
        "total": total,
    }


@app.get("/api/v1/orders/{order_id}")
def order_detail(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.scalar(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == user.id,
        )
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    return {
        "id": order.id,
        "status": order.status,
        "subtotal": order.subtotal,
        "shipping_fee": order.shipping_fee,
        "total": order.total,
        "currency": order.currency,
        "shipping_address": order.shipping_address,
        "created_at": order.created_at.isoformat(),
        "items": [
            {
                "product_id": item.product_id,
                "name": item.product_name_snapshot,
                "unit_price": item.unit_price_snapshot,
                "quantity": item.quantity,
                "line_total": item.line_total,
            }
            for item in order.items
        ],
    }