from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import asc

from app.database.session import get_db
from app.database.models import Vendor, Part, VendorInventory
from app.utils.geo import haversine_km

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.get("/recommendations")
def recommendations(
    part: str = Query(..., description="Part name, e.g. ALTERNATOR"),
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    limit: int = Query(10, ge=1, le=50),
    in_stock_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    part_row = db.query(Part).filter(Part.part_name == part).first()
    if not part_row:
        return {"success": False, "message": f"Part not found: {part}", "results": []}

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
        item = {
            "vendor_id": vendor.id,
            "vendor": vendor.name,
            "phone": vendor.phone,
            "address": vendor.address,
            "city": vendor.city,
            "district": vendor.district,
            "price_lkr": inv.price_lkr,
            "stock_qty": inv.stock_qty,
            "lat": vendor.lat,
            "lng": vendor.lng,
        }
        if lat is not None and lng is not None and vendor.lat is not None and vendor.lng is not None:
            item["distance_km"] = round(haversine_km(lat, lng, vendor.lat, vendor.lng), 2)
        results.append(item)

    # Sort logic
    if lat is not None and lng is not None:
        # sort by distance then price
        results.sort(key=lambda x: (x.get("distance_km", 99999), x["price_lkr"]))
    else:
        results.sort(key=lambda x: x["price_lkr"])

    return {"success": True, "part": part, "results": results[:limit]}