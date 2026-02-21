"""
Crop Knowledge Base — growth stages, weather sensitivities, and advisory rules.
Used to generate crop-specific weather impact analysis.
"""

# Each crop has: growth stages with duration, ideal weather, and weather risks
CROP_DATABASE = {
    "Wheat": {
        "total_days": 120,
        "stages": [
            {"name": "Sowing", "days": (1, 15), "ideal_temp": (10, 25), "rain_need": "moderate",
             "risks": {"frost": "Critical — seedlings will die", "heavy_rain": "Seeds may rot, poor germination",
                       "heatwave": "Poor germination rate"}},
            {"name": "Tillering", "days": (16, 45), "ideal_temp": (12, 22), "rain_need": "moderate",
             "risks": {"frost": "Stunted growth", "heavy_rain": "Root damage, waterlogging",
                       "drought": "Fewer tillers, reduced yield"}},
            {"name": "Heading", "days": (46, 75), "ideal_temp": (15, 25), "rain_need": "moderate",
             "risks": {"frost": "Sterile heads — major yield loss", "heavy_rain": "Lodging, fungal diseases",
                       "heatwave": "Shriveled grains"}},
            {"name": "Grain Filling", "days": (76, 100), "ideal_temp": (18, 28), "rain_need": "low",
             "risks": {"heavy_rain": "Grain rot, sprouting in ear", "heatwave": "Forced maturity, small grains",
                       "humidity": "Fungal infections"}},
            {"name": "Harvest Ready", "days": (101, 120), "ideal_temp": (20, 35), "rain_need": "none",
             "risks": {"heavy_rain": "Crop damage, grain spoilage — HARVEST IMMEDIATELY",
                       "humidity": "Grain moisture too high, storage issues",
                       "storm": "Lodging, complete crop loss possible"}},
        ],
    },
    "Rice": {
        "total_days": 150,
        "stages": [
            {"name": "Nursery", "days": (1, 25), "ideal_temp": (25, 35), "rain_need": "high",
             "risks": {"frost": "Seedling death", "drought": "Poor seedling growth",
                       "storm": "Nursery bed damage"}},
            {"name": "Transplanting", "days": (26, 40), "ideal_temp": (25, 32), "rain_need": "high",
             "risks": {"drought": "Fields dry up, transplanting impossible",
                       "heavy_rain": "Flooding washes away seedlings"}},
            {"name": "Vegetative", "days": (41, 80), "ideal_temp": (25, 30), "rain_need": "high",
             "risks": {"drought": "Stunted growth", "heatwave": "Reduced tillering",
                       "storm": "Lodging"}},
            {"name": "Flowering", "days": (81, 110), "ideal_temp": (25, 30), "rain_need": "moderate",
             "risks": {"frost": "Sterile flowers", "heavy_rain": "Poor pollination",
                       "heatwave": "Spikelet sterility above 35°C"}},
            {"name": "Maturity", "days": (111, 150), "ideal_temp": (20, 30), "rain_need": "low",
             "risks": {"heavy_rain": "Grain discoloration, shattering",
                       "humidity": "Fungal infections on grain"}},
        ],
    },
    "Tomato": {
        "total_days": 90,
        "stages": [
            {"name": "Seedling", "days": (1, 20), "ideal_temp": (20, 30), "rain_need": "moderate",
             "risks": {"frost": "Seedling death below 5°C", "heavy_rain": "Damping off disease",
                       "heatwave": "Wilting, sunburn"}},
            {"name": "Vegetative", "days": (21, 40), "ideal_temp": (22, 28), "rain_need": "moderate",
             "risks": {"frost": "Growth stops", "drought": "Blossom end rot risk",
                       "heavy_rain": "Root diseases"}},
            {"name": "Flowering", "days": (41, 55), "ideal_temp": (20, 27), "rain_need": "low",
             "risks": {"heavy_rain": "Flower drop, poor fruit set",
                       "heatwave": "Flower abortion above 35°C", "humidity": "Fungal infections"}},
            {"name": "Fruiting", "days": (56, 75), "ideal_temp": (22, 30), "rain_need": "low",
             "risks": {"heavy_rain": "Fruit cracking, blight", "heatwave": "Sunscald on fruits",
                       "humidity": "Late blight risk"}},
            {"name": "Harvest", "days": (76, 90), "ideal_temp": (20, 30), "rain_need": "none",
             "risks": {"heavy_rain": "Fruit rot, quality loss",
                       "frost": "Fruit damage", "humidity": "Post-harvest losses"}},
        ],
    },
    "Potato": {
        "total_days": 100,
        "stages": [
            {"name": "Planting", "days": (1, 15), "ideal_temp": (15, 20), "rain_need": "moderate",
             "risks": {"frost": "Seed piece rot", "heavy_rain": "Waterlogging, rotting",
                       "heatwave": "No sprouting"}},
            {"name": "Vegetative", "days": (16, 40), "ideal_temp": (15, 25), "rain_need": "moderate",
             "risks": {"frost": "Foliage damage", "drought": "Stunted growth",
                       "heatwave": "Reduced vigor"}},
            {"name": "Tuber Initiation", "days": (41, 60), "ideal_temp": (15, 20), "rain_need": "moderate",
             "risks": {"heatwave": "Poor tuber formation above 30°C", "drought": "Fewer tubers",
                       "heavy_rain": "Blight risk increases"}},
            {"name": "Tuber Bulking", "days": (61, 85), "ideal_temp": (15, 22), "rain_need": "moderate",
             "risks": {"heatwave": "Tuber growth stops at 30°C", "heavy_rain": "Late blight epidemic",
                       "humidity": "Late blight conditions"}},
            {"name": "Maturity", "days": (86, 100), "ideal_temp": (15, 25), "rain_need": "low",
             "risks": {"heavy_rain": "Tuber rot in soil", "frost": "Tuber damage",
                       "humidity": "Skin diseases"}},
        ],
    },
    "Cotton": {
        "total_days": 180,
        "stages": [
            {"name": "Sowing", "days": (1, 20), "ideal_temp": (25, 35), "rain_need": "moderate",
             "risks": {"frost": "No germination", "heavy_rain": "Seed rot, crusting",
                       "drought": "Poor stand"}},
            {"name": "Vegetative", "days": (21, 60), "ideal_temp": (25, 35), "rain_need": "moderate",
             "risks": {"drought": "Reduced plant size", "heavy_rain": "Root rot",
                       "heatwave": "Excessive vegetative growth"}},
            {"name": "Flowering", "days": (61, 100), "ideal_temp": (25, 32), "rain_need": "moderate",
             "risks": {"heavy_rain": "Flower and boll shedding", "drought": "Boll shedding",
                       "humidity": "Bollworm increase"}},
            {"name": "Boll Development", "days": (101, 150), "ideal_temp": (25, 30), "rain_need": "low",
             "risks": {"heavy_rain": "Boll rot", "humidity": "Quality degradation",
                       "heatwave": "Premature opening"}},
            {"name": "Picking", "days": (151, 180), "ideal_temp": (20, 35), "rain_need": "none",
             "risks": {"heavy_rain": "Lint quality ruined — pick immediately",
                       "humidity": "Discoloration", "storm": "Lint blown away"}},
        ],
    },
    "Soybean": {
        "total_days": 110,
        "stages": [
            {"name": "Sowing", "days": (1, 15), "ideal_temp": (20, 30), "rain_need": "moderate",
             "risks": {"frost": "No germination", "heavy_rain": "Seed rot",
                       "drought": "Poor emergence"}},
            {"name": "Vegetative", "days": (16, 45), "ideal_temp": (22, 30), "rain_need": "moderate",
             "risks": {"drought": "Stunted growth", "heavy_rain": "Root diseases",
                       "heatwave": "Wilting"}},
            {"name": "Flowering", "days": (46, 65), "ideal_temp": (22, 28), "rain_need": "moderate",
             "risks": {"drought": "Flower abortion", "heatwave": "Poor pod set above 35°C",
                       "heavy_rain": "Flower drop"}},
            {"name": "Pod Filling", "days": (66, 95), "ideal_temp": (22, 28), "rain_need": "low",
             "risks": {"drought": "Small seeds", "heavy_rain": "Pod rot",
                       "humidity": "Fungal diseases"}},
            {"name": "Maturity", "days": (96, 110), "ideal_temp": (20, 30), "rain_need": "none",
             "risks": {"heavy_rain": "Pod shattering, germination in pods",
                       "humidity": "Quality loss"}},
        ],
    },
}

# Simulated farmer profile — in production, this comes from the database
FARMER_CROPS = [
    {"crop": "Wheat", "planted_date": "2025-11-15", "area_acres": 5},
    {"crop": "Tomato", "planted_date": "2026-01-10", "area_acres": 2},
    {"crop": "Potato", "planted_date": "2025-12-20", "area_acres": 3},
]


def get_crop_stage(crop_name: str, planted_date: str, current_date: str) -> dict | None:
    """Determine the current growth stage of a crop."""
    from datetime import datetime

    crop = CROP_DATABASE.get(crop_name)
    if not crop:
        return None

    planted = datetime.strptime(planted_date, "%Y-%m-%d")
    current = datetime.strptime(current_date, "%Y-%m-%d")
    days_since_planting = (current - planted).days

    if days_since_planting < 0:
        return {"stage": "Not Planted Yet", "days_in_stage": 0, "days_to_next": abs(days_since_planting),
                "total_days": crop["total_days"], "day": 0, "risks": {}}

    if days_since_planting > crop["total_days"]:
        return {"stage": "Harvest Overdue", "days_in_stage": days_since_planting - crop["total_days"],
                "days_to_next": 0, "total_days": crop["total_days"], "day": days_since_planting,
                "risks": {"any": "Crop past maturity — harvest immediately to avoid losses"}}

    for stage in crop["stages"]:
        start, end = stage["days"]
        if start <= days_since_planting <= end:
            days_to_next = end - days_since_planting
            next_stage = None
            for s in crop["stages"]:
                if s["days"][0] > end:
                    next_stage = s["name"]
                    break
            return {
                "stage": stage["name"],
                "days_in_stage": days_since_planting - start + 1,
                "stage_duration": end - start + 1,
                "days_to_next": days_to_next,
                "next_stage": next_stage or "Harvest Complete",
                "ideal_temp": stage["ideal_temp"],
                "rain_need": stage["rain_need"],
                "total_days": crop["total_days"],
                "day": days_since_planting,
                "risks": stage["risks"],
            }

    return None


def analyze_weather_impact(weather_data: dict, crop_name: str, stage_info: dict) -> dict:
    """
    Analyze how current/forecast weather impacts a crop at its current stage.
    Returns impact assessment with severity and recommendations.
    """
    impacts = []
    overall_sentiment = "good"  # good, caution, danger

    temp = weather_data.get("temperature", 20)
    humidity = weather_data.get("humidity", 50)
    wind_speed = weather_data.get("wind_speed", 0)
    description = weather_data.get("description", "").lower()
    rain_prob = weather_data.get("rain_probability", 0)

    risks = stage_info.get("risks", {})
    ideal = stage_info.get("ideal_temp", (15, 30))

    # Temperature check
    if temp < ideal[0] - 5:
        if "frost" in risks:
            impacts.append({"type": "danger", "icon": "🥶", "title": "Frost Risk",
                            "message": risks["frost"], "action": "Cover crops with mulch or plastic sheets"})
            overall_sentiment = "danger"
        else:
            impacts.append({"type": "caution", "icon": "🌡️", "title": "Cold Temperature",
                            "message": f"Temperature ({temp:.0f}°C) is below ideal range ({ideal[0]}-{ideal[1]}°C)",
                            "action": "Monitor closely, consider frost protection"})
            overall_sentiment = "caution"
    elif temp > ideal[1] + 5:
        if "heatwave" in risks:
            impacts.append({"type": "danger", "icon": "🔥", "title": "Heatwave Alert",
                            "message": risks["heatwave"], "action": "Increase irrigation frequency, provide shade if possible"})
            overall_sentiment = "danger"
        else:
            impacts.append({"type": "caution", "icon": "☀️", "title": "High Temperature",
                            "message": f"Temperature ({temp:.0f}°C) is above ideal range ({ideal[0]}-{ideal[1]}°C)",
                            "action": "Ensure adequate irrigation"})
            overall_sentiment = "caution"
    else:
        impacts.append({"type": "good", "icon": "✅", "title": "Temperature Optimal",
                        "message": f"{temp:.0f}°C is within ideal range ({ideal[0]}-{ideal[1]}°C) for {stage_info['stage']}",
                        "action": "No action needed"})

    # Rain check
    rain_keywords = ["rain", "drizzle", "shower", "thunderstorm", "storm"]
    is_rainy = any(k in description for k in rain_keywords) or rain_prob > 60

    if is_rainy:
        rain_need = stage_info.get("rain_need", "moderate")
        if rain_need == "none":
            if "heavy_rain" in risks:
                impacts.append({"type": "danger", "icon": "🌧️", "title": "Rain — Bad for Crop",
                                "message": risks["heavy_rain"],
                                "action": "Speed up harvest operations if possible"})
                overall_sentiment = "danger"
            else:
                impacts.append({"type": "caution", "icon": "🌧️", "title": "Rain — Not Ideal",
                                "message": f"Rain is not needed during {stage_info['stage']} stage",
                                "action": "Ensure proper drainage"})
                if overall_sentiment != "danger":
                    overall_sentiment = "caution"
        elif rain_need == "low":
            if "heavy_rain" in risks:
                impacts.append({"type": "caution", "icon": "🌧️", "title": "Rain — Monitor",
                                "message": risks["heavy_rain"],
                                "action": "Check drainage, avoid waterlogging"})
                if overall_sentiment != "danger":
                    overall_sentiment = "caution"
        else:
            impacts.append({"type": "good", "icon": "🌧️", "title": "Rain — Beneficial",
                            "message": f"Rain is expected — good for the {stage_info['stage']} stage which needs {rain_need} water",
                            "action": "Reduce irrigation to save water"})
    else:
        rain_need = stage_info.get("rain_need", "moderate")
        if rain_need == "high" and humidity < 40:
            if "drought" in risks:
                impacts.append({"type": "caution", "icon": "🏜️", "title": "Dry Conditions",
                                "message": risks["drought"],
                                "action": "Increase irrigation immediately"})
                if overall_sentiment != "danger":
                    overall_sentiment = "caution"

    # Humidity check
    if humidity > 85:
        if "humidity" in risks:
            impacts.append({"type": "caution", "icon": "💧", "title": "High Humidity",
                            "message": risks["humidity"],
                            "action": "Apply preventive fungicide spray, improve air circulation"})
            if overall_sentiment != "danger":
                overall_sentiment = "caution"

    # Wind check
    if wind_speed > 10:
        if "storm" in risks:
            impacts.append({"type": "danger", "icon": "💨", "title": "Strong Winds",
                            "message": risks["storm"],
                            "action": "Provide support stakes, delay spraying operations"})
            overall_sentiment = "danger"
        else:
            impacts.append({"type": "caution", "icon": "💨", "title": "Windy Conditions",
                            "message": "High winds can cause lodging and damage",
                            "action": "Avoid spraying pesticides — spray will drift"})

    # Spray conditions
    is_spray_ok = (not is_rainy and wind_speed < 8 and humidity < 85 and temp > 10)
    impacts.append({
        "type": "good" if is_spray_ok else "caution",
        "icon": "🧪",
        "title": f"Spray Conditions {'Good' if is_spray_ok else 'Not Ideal'}",
        "message": "Conditions are suitable for pesticide/fertilizer application" if is_spray_ok
                   else "Avoid spraying — rain, wind, or humidity will reduce effectiveness",
        "action": "Apply in early morning or late evening for best results" if is_spray_ok
                  else "Wait for clear, calm weather"
    })

    return {
        "overall": overall_sentiment,
        "summary": _get_summary(overall_sentiment, crop_name, stage_info),
        "impacts": impacts,
    }


def _get_summary(sentiment: str, crop_name: str, stage: dict) -> str:
    if sentiment == "danger":
        return f"⚠️ WARNING: Current weather conditions are harmful for your {crop_name} at {stage['stage']} stage. Take immediate protective action."
    elif sentiment == "caution":
        return f"⚡ CAUTION: Some weather conditions need monitoring for your {crop_name} at {stage['stage']} stage."
    else:
        return f"✅ Weather is favorable for your {crop_name} at {stage['stage']} stage. Continue normal operations."
