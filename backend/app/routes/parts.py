from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.database.models import Part, Vendor, VendorInventory

router = APIRouter(prefix="/parts", tags=["Parts"])


@router.get("/search")
def search_parts(
    q: str = Query("", description="search keyword"),
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db)
):
    q2 = q.strip()

    parts_query = db.query(Part)
    if q2:
        parts_query = parts_query.filter(Part.part_name.like(f"%{q2}%"))

    parts = parts_query.order_by(Part.part_name.asc()).limit(limit).all()

    # For each part: best price + vendor count
    results = []
    for p in parts:
        min_price = db.query(func.min(VendorInventory.price_lkr)).filter(VendorInventory.part_id == p.id).scalar()
        vendor_count = db.query(func.count(VendorInventory.vendor_id)).filter(VendorInventory.part_id == p.id).scalar()
        results.append({
            "part_name": p.part_name,
            "best_price_lkr": int(min_price) if min_price is not None else None,
            "vendor_count": int(vendor_count) if vendor_count is not None else 0
        })

    return {"success": True, "query": q2, "results": results}


@router.get("/{part_name}/vendors")
def vendors_for_part(
    part_name: str = Path(..., description="Exact part name, e.g. ALTERNATOR"),
    limit: int = Query(20, ge=1, le=50),
    in_stock_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    part_row = db.query(Part).filter(Part.part_name == part_name).first()
    if not part_row:
        return {"success": False, "message": f"Part not found: {part_name}", "results": []}

    q = (
        db.query(Vendor, VendorInventory)
        .join(VendorInventory, VendorInventory.vendor_id == Vendor.id)
        .filter(VendorInventory.part_id == part_row.id)
    )
    if in_stock_only:
        q = q.filter(VendorInventory.stock_qty > 0)

    rows = q.all()

    results = []
    for vendor, inv in rows:
        results.append({
            "vendor_id": vendor.id,
            "vendor": vendor.name,
            "phone": vendor.phone,
            "address": vendor.address,
            "city": vendor.city,
            "district": vendor.district,
            "price_lkr": inv.price_lkr,
            "stock_qty": inv.stock_qty
        })

    results.sort(key=lambda x: x["price_lkr"])
    return {"success": True, "part": part_name, "results": results[:limit]}