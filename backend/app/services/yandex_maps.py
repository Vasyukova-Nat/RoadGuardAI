import aiohttp
import os
from typing import Dict, List, Any

class YandexMapsService:
    def __init__(self):
        self.api_key = os.getenv("YANDEX_MAPS_API_KEY", "")
                
        if not self.api_key:
            print("Ключ не найден. Проверь .env файл и docker-compose.yml")
        
        self.geocode_url = "https://geocode-maps.yandex.ru/1.x/"
        
        print(f"Яндекс.Карты сервис инициализирован (режим: геокодер)")
    
    async def suggest_address(self, query: str) -> List[Dict[str, Any]]:
        if not query or len(query) < 3:
            return []
        
        url = f"{self.geocode_url}?apikey={self.api_key}&geocode={query}&format=json&results=5"
        
        try:
            print(f"URL запроса: {url}")
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=5) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_geocode_response(data)
                    else:
                        error_text = await response.text()
                        print(f"Ошибка API: {response.status} - {error_text}")
                        return []
                        
        except Exception as e:
            print(f"Ошибка при запросе: {e}")
            return []
    
    def _parse_geocode_response(self, data: Dict) -> List[Dict[str, Any]]:
        """
        Парсит ответ от Геокодера в формат для автокомплита
        """
        suggestions = []
        
        try:
            features = data.get("response", {}).get("GeoObjectCollection", {}).get("featureMember", [])
            print(f"Получено результатов: {len(features)}")
            
            for feature in features:
                geo = feature.get("GeoObject", {})
                name = geo.get("name", "")
                description = geo.get("description", "")
                pos = geo.get("Point", {}).get("pos", "").split(" ") # Координаты
                
                if description:
                    full_address = f"{name}, {description}" # Формируем понятный адрес
                else:
                    full_address = name
                
                suggestion = {
                    "address": full_address,
                    "display": name,
                    "subtitle": description,
                    "lat": float(pos[1]) if len(pos) == 2 else None,
                    "lon": float(pos[0]) if len(pos) == 2 else None
                }
                
                suggestions.append(suggestion)
                
        except Exception as e:
            print(f"Ошибка парсинга ответа: {e}")
        
        return suggestions
    
    async def geocode_address(self, address: str) -> Dict[str, Any]:
        """Получение координат по полному адресу"""
        results = await self.suggest_address(address)
        return results[0] if results else {}