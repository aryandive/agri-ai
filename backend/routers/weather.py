import os
from datetime import datetime
import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from models import (
    WeatherResponse, WeatherCurrent, ForecastDay, HourlyForecast,
    WeatherAlert, AgriAdvisory, CropImpact,
)
from services.crop_advisory import (
    FARMER_CROPS, CROP_DATABASE, get_crop_stage, analyze_weather_impact,
)

router = APIRouter(prefix="/api", tags=["weather"])

OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5"


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(
    city: str = Query(..., description="City name, e.g. 'Delhi'"),
    clerk_id: Optional[str] = None
):
    """
    Returns current weather, hourly forecast, 5-day forecast,
    agriculture alerts, and crop-specific impact analysis.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENWEATHER_API_KEY not configured. Add it to your .env file.",
        )

    async with httpx.AsyncClient(timeout=10.0) as client:
        # --- Current Weather ---
        try:
            current_resp = await client.get(
                f"{OPENWEATHER_BASE}/weather",
                params={"q": city, "appid": api_key, "units": "metric"},
            )
            current_resp.raise_for_status()
            cd = current_resp.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"City '{city}' not found.")
            raise HTTPException(status_code=502, detail=f"Weather API error: {e.response.text}")
        except httpx.RequestError:
            raise HTTPException(status_code=502, detail="Could not connect to weather service.")

        # Parse sunrise/sunset
        sunrise_str = None
        sunset_str = None
        try:
            sunrise_str = datetime.fromtimestamp(cd["sys"]["sunrise"]).strftime("%I:%M %p")
            sunset_str = datetime.fromtimestamp(cd["sys"]["sunset"]).strftime("%I:%M %p")
        except Exception:
            pass

        current = WeatherCurrent(
            temperature=cd["main"]["temp"],
            feels_like=cd["main"]["feels_like"],
            humidity=cd["main"]["humidity"],
            description=cd["weather"][0]["description"].title(),
            icon=cd["weather"][0]["icon"],
            wind_speed=cd["wind"]["speed"],
            city=cd["name"],
            pressure=cd["main"].get("pressure"),
            visibility=cd.get("visibility"),
            sunrise=sunrise_str,
            sunset=sunset_str,
            clouds=cd.get("clouds", {}).get("all"),
        )

        # --- 5-Day / 3-Hour Forecast ---
        try:
            forecast_resp = await client.get(
                f"{OPENWEATHER_BASE}/forecast",
                params={"q": city, "appid": api_key, "units": "metric", "cnt": 40},
            )
            forecast_resp.raise_for_status()
            forecast_data = forecast_resp.json()
        except Exception:
            return WeatherResponse(current=current, forecast=[], hourly=[], advisory=None)

        entries = forecast_data.get("list", [])

        # --- Hourly Forecast (next 24h = 8 entries × 3h) ---
        hourly = []
        for entry in entries[:8]:
            dt = datetime.fromtimestamp(entry["dt"])
            hourly.append(HourlyForecast(
                time=dt.strftime("%I:%M %p"),
                temperature=entry["main"]["temp"],
                description=entry["weather"][0]["description"].title(),
                icon=entry["weather"][0]["icon"],
                humidity=entry["main"]["humidity"],
                wind_speed=entry["wind"]["speed"],
                rain_probability=round(entry.get("pop", 0) * 100),
            ))

        # --- Daily Aggregation ---
        daily: dict[str, dict] = {}
        for entry in entries:
            dt = datetime.fromtimestamp(entry["dt"])
            date_str = dt.strftime("%Y-%m-%d")
            pop = entry.get("pop", 0) * 100
            if date_str not in daily:
                daily[date_str] = {
                    "date": dt.strftime("%a, %b %d"),
                    "temp_min": entry["main"]["temp_min"],
                    "temp_max": entry["main"]["temp_max"],
                    "description": entry["weather"][0]["description"].title(),
                    "icon": entry["weather"][0]["icon"],
                    "rain_prob": pop,
                    "humidity": entry["main"]["humidity"],
                    "count": 1,
                }
            else:
                d = daily[date_str]
                d["temp_min"] = min(d["temp_min"], entry["main"]["temp_min"])
                d["temp_max"] = max(d["temp_max"], entry["main"]["temp_max"])
                d["rain_prob"] = max(d["rain_prob"], pop)
                d["humidity"] = (d["humidity"] * d["count"] + entry["main"]["humidity"]) // (d["count"] + 1)
                d["count"] += 1

        forecast = [
            ForecastDay(
                date=d["date"],
                temperature_min=d["temp_min"],
                temperature_max=d["temp_max"],
                description=d["description"],
                icon=d["icon"],
                rain_probability=round(d["rain_prob"]),
                humidity=d["humidity"],
            )
            for d in list(daily.values())[:5]
        ]

        # --- Fetch User Crops if available ---
        farmer_crops = FARMER_CROPS
        if clerk_id:
            try:
                from database import get_db
                import json
                db = await get_db()
                async with db.execute("SELECT crops FROM user_profiles WHERE clerk_id = ?", (clerk_id,)) as cursor:
                    row = await cursor.fetchone()
                    if row and row[0]:
                        parsed = json.loads(row[0])
                        if isinstance(parsed, list) and len(parsed) > 0:
                            farmer_crops = parsed
            except Exception as e:
                print("Error loading crops for weather advisory:", e)

        # --- Agriculture Advisory ---
        advisory = _generate_advisory(current, forecast, hourly, farmer_crops)

        return WeatherResponse(
            current=current,
            forecast=forecast,
            hourly=hourly,
            advisory=advisory,
        )


def _generate_advisory(current: WeatherCurrent, forecast: list[ForecastDay], hourly: list[HourlyForecast], farmer_crops: list) -> AgriAdvisory:
    """Generate agriculture alerts and crop-specific impact analysis."""

    alerts: list[WeatherAlert] = []
    temp = current.temperature
    humidity = current.humidity
    wind = current.wind_speed
    desc = current.description.lower()

    # Frost warning
    if temp <= 2:
        alerts.append(WeatherAlert(type="frost", severity="danger",
            message=f"Temperature is {temp:.0f}°C — frost conditions detected",
            action="Cover crops with mulch or plastic sheets immediately"))
    elif temp <= 5:
        alerts.append(WeatherAlert(type="frost", severity="warning",
            message=f"Temperature is {temp:.0f}°C — frost risk tonight",
            action="Prepare frost protection, monitor overnight temperature"))

    # Heat warning
    if temp >= 42:
        alerts.append(WeatherAlert(type="heatwave", severity="danger",
            message=f"Extreme heat at {temp:.0f}°C — crop stress imminent",
            action="Emergency irrigation, provide shade for sensitive crops"))
    elif temp >= 38:
        alerts.append(WeatherAlert(type="heatwave", severity="warning",
            message=f"High temperature at {temp:.0f}°C — heat stress risk",
            action="Increase irrigation, avoid field work during peak hours"))

    # Rain/storm
    rain_keywords = ["rain", "drizzle", "shower", "thunderstorm", "storm"]
    if any(k in desc for k in rain_keywords):
        if "thunderstorm" in desc or "storm" in desc:
            alerts.append(WeatherAlert(type="storm", severity="danger",
                message="Thunderstorm/storm conditions detected",
                action="Secure equipment, avoid field work, protect harvest"))
        elif "heavy" in desc:
            alerts.append(WeatherAlert(type="rain", severity="warning",
                message="Heavy rain expected — waterlogging risk",
                action="Check drainage channels, delay sowing or spraying"))
        else:
            alerts.append(WeatherAlert(type="rain", severity="info",
                message="Light rain expected — may be beneficial",
                action="Reduce irrigation, delay pesticide spraying"))

    # High humidity
    if humidity >= 85:
        alerts.append(WeatherAlert(type="humidity", severity="warning",
            message=f"Humidity at {humidity}% — fungal disease risk high",
            action="Apply preventive fungicide, improve ventilation"))

    # High wind
    if wind >= 12:
        alerts.append(WeatherAlert(type="wind", severity="warning",
            message=f"Wind speed {wind:.1f} m/s — avoid spraying",
            action="Delay spray operations, check crop supports"))

    # Spray conditions
    is_spray_ok = not any(k in desc for k in rain_keywords) and wind < 8 and humidity < 85 and temp > 10
    alerts.append(WeatherAlert(
        type="spray",
        severity="good" if is_spray_ok else "warning",
        message="Spray conditions are favorable" if is_spray_ok else "Spray conditions are NOT favorable",
        action="Apply in early morning or late evening" if is_spray_ok else "Wait for clear, calm weather",
    ))

    # Upcoming rain check from forecast
    rain_days = [f for f in forecast if f.rain_probability and f.rain_probability > 60]
    if rain_days:
        alerts.append(WeatherAlert(type="forecast_rain", severity="info",
            message=f"Rain expected on {', '.join(d.date for d in rain_days[:3])} — plan irrigation accordingly",
            action="Adjust watering schedule, prepare drainage"))

    # --- Crop Impact Analysis ---
    crop_impacts: list[CropImpact] = []
    today = datetime.now().strftime("%Y-%m-%d")

    for fc in farmer_crops:
        crop_name = fc["crop"]
        if crop_name not in CROP_DATABASE:
            continue
        stage_info = get_crop_stage(crop_name, fc["planted_date"], today)
        if not stage_info:
            continue

        weather_dict = {
            "temperature": current.temperature,
            "humidity": current.humidity,
            "wind_speed": current.wind_speed,
            "description": current.description,
            "rain_probability": max((h.rain_probability for h in hourly[:4]), default=0),
        }

        impact = analyze_weather_impact(weather_dict, crop_name, stage_info)

        crop_impacts.append(CropImpact(
            crop=crop_name,
            stage=stage_info["stage"],
            day=stage_info["day"],
            total_days=stage_info["total_days"],
            days_to_next=stage_info["days_to_next"],
            next_stage=stage_info.get("next_stage", "Complete"),
            overall=impact["overall"],
            summary=impact["summary"],
            impacts=impact["impacts"],
        ))

    return AgriAdvisory(alerts=alerts, crop_impacts=crop_impacts)
