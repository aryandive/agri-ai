from pydantic import BaseModel
from typing import Optional


class AnalyzeResponse(BaseModel):
    disease_name: str
    confidence: str
    description: str
    cure_steps: list[str]
    pesticides: list[str]
    prevention_tips: list[str]


class WeatherCurrent(BaseModel):
    temperature: float
    feels_like: float
    humidity: int
    description: str
    icon: str
    wind_speed: float
    city: str
    pressure: Optional[int] = None
    visibility: Optional[int] = None
    sunrise: Optional[str] = None
    sunset: Optional[str] = None
    clouds: Optional[int] = None


class HourlyForecast(BaseModel):
    time: str
    temperature: float
    description: str
    icon: str
    humidity: int
    wind_speed: float
    rain_probability: float


class ForecastDay(BaseModel):
    date: str
    temperature_min: float
    temperature_max: float
    description: str
    icon: str
    rain_probability: Optional[float] = 0
    humidity: Optional[int] = None


class WeatherAlert(BaseModel):
    type: str
    severity: str
    message: str
    action: str


class CropImpact(BaseModel):
    crop: str
    stage: str
    day: int
    total_days: int
    days_to_next: int
    next_stage: str
    overall: str  # good / caution / danger
    summary: str
    impacts: list[dict]


class AgriAdvisory(BaseModel):
    alerts: list[WeatherAlert]
    crop_impacts: list[CropImpact]


class WeatherResponse(BaseModel):
    current: WeatherCurrent
    forecast: list[ForecastDay]
    hourly: list[HourlyForecast]
    advisory: Optional[AgriAdvisory] = None


class PlannerRequest(BaseModel):
    soil_type: Optional[str] = None
    acres: Optional[float] = None
    location: Optional[str] = None
    water_availability: Optional[str] = None
    mandi_prices: Optional[dict] = None


class CropSuggestion(BaseModel):
    crop: str
    season: str
    duration: str
    yieldPerAcre: str
    waterNeeded: str
    seedRate: str
    fertilizer: str
    bestSoil: str
    emoji: str
    reasoning: str


class PlannerResponse(BaseModel):
    suggestions: list[CropSuggestion]
