import json
import random
from datetime import datetime

from app.database.session import SessionLocal
from app.database.models import Vendor, Part, VendorInventory

PARTS_JSON = "app/models/effnet_classes.json"

WESTERN_VENDORS = [
    # Colombo District
    {"name": "Colombo Auto Spares", "phone": "0112345678", "address": "Panchikawatte, Colombo 10", "city": "Colombo", "district": "Colombo", "lat": 6.9271, "lng": 79.8612},
    {"name": "Nugegoda Motors", "phone": "0112987654", "address": "High Level Rd, Nugegoda", "city": "Nugegoda", "district": "Colombo", "lat": 6.8649, "lng": 79.8997},
    {"name": "Moratuwa Parts Hub", "phone": "0114455667", "address": "Galle Rd, Moratuwa", "city": "Moratuwa", "district": "Colombo", "lat": 6.7730, "lng": 79.8816},
    {"name": "Kaduwela Auto Mart", "phone": "0117788990", "address": "Kaduwela", "city": "Kaduwela", "district": "Colombo", "lat": 6.9356, "lng": 79.9847},

    # Gampaha District
    {"name": "Negombo Spares Centre", "phone": "0312223344", "address": "Main St, Negombo", "city": "Negombo", "district": "Gampaha", "lat": 7.2083, "lng": 79.8358},
    {"name": "Wattala Auto World", "phone": "0115566778", "address": "Negombo Rd, Wattala", "city": "Wattala", "district": "Gampaha", "lat": 6.9896, "lng": 79.8910},
    {"name": "Gampaha Motor Stores", "phone": "0332233445", "address": "Yakkala Rd, Gampaha", "city": "Gampaha", "district": "Gampaha", "lat": 7.0917, "lng": 79.9990},
    {"name": "Ja-Ela Spare Point", "phone": "0113344556", "address": "Ja-Ela", "city": "Ja-Ela", "district": "Gampaha", "lat": 7.0744, "lng": 79.8919},

    # Kalutara District
    {"name": "Panadura Auto Parts", "phone": "0382233445", "address": "Galle Rd, Panadura", "city": "Panadura", "district": "Kalutara", "lat": 6.7132, "lng": 79.9026},
    {"name": "Kalutara Spares House", "phone": "0342233445", "address": "Kalutara South", "city": "Kalutara", "district": "Kalutara", "lat": 6.5854, "lng": 79.9607},
]

def price_for_part(part_name: str) -> tuple[int, int]:
    """Return (min,max) price range in LKR based on rough type."""
    p = part_name.upper()
    big = ["ENGINE", "TRANSMISSION", "ALTERNATOR", "AIR COMPRESSOR", "TURBO", "RADIATOR"]
    mid = ["BRAKE", "CAMSHAFT", "CRANKSHAFT", "CLUTCH", "FUEL", "STARTER", "SUSPENSION", "STEERING"]

    if any(k in p for k in big):
        return (60000, 250000)
    if any(k in p for k in mid):
        return (15000, 80000)
    return (3000, 25000)

def main():
    db = SessionLocal()
    try:
        # load parts list (50 class names)
        with open(PARTS_JSON, "r", encoding="utf-8") as f:
            parts = json.load(f)

        # upsert parts
        part_rows = {}
        for name in parts:
            name = str(name).strip()
            existing = db.query(Part).filter(Part.part_name == name).first()
            if not existing:
                existing = Part(part_name=name)
                db.add(existing)
                db.flush()
            part_rows[name] = existing

        # upsert vendors
        vendor_rows = []
        for v in WESTERN_VENDORS:
            existing = db.query(Vendor).filter(Vendor.name == v["name"]).first()
            if not existing:
                existing = Vendor(**v)
                db.add(existing)
                db.flush()
            vendor_rows.append(existing)

        db.commit()

        # seed inventory for ALL parts (so demo never returns empty)
        for vendor in vendor_rows:
            for part_name, part in part_rows.items():
                lo, hi = price_for_part(part_name)
                price = random.randint(lo, hi)

                # some out-of-stock realism
                stock = random.randint(0, 20)
                if random.random() < 0.15:
                    stock = 0

                existing = (
                    db.query(VendorInventory)
                    .filter(VendorInventory.vendor_id == vendor.id, VendorInventory.part_id == part.id)
                    .first()
                )
                if not existing:
                    db.add(VendorInventory(
                        vendor_id=vendor.id,
                        part_id=part.id,
                        price_lkr=price,
                        stock_qty=stock
                    ))
                else:
                    existing.price_lkr = price
                    existing.stock_qty = stock

        db.commit()
        print("✅ Seed complete: vendors, parts, vendor_inventory inserted/updated.")

    finally:
        db.close()

if __name__ == "__main__":
    main()