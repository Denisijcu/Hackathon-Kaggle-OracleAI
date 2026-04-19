import requests
from bs4 import BeautifulSoup
import time

class SportsService:
    def __init__(self):
        # Usamos una fuente con HTML estable
        self.url = "https://www.bbc.com/sport/football/scores-fixtures"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VertexIntelligenceCore/4.1'
        }
        self._cache = []
        self._last_update = 0

    def get_live_scores(self):
        # Cache de 5 minutos para no saturar la red ni la Pi 5
        if time.time() - self._last_update < 300 and self._cache:
            return self._cache

        try:
            response = requests.get(self.url, headers=self.headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Buscamos los contenedores de partidos
            matches = soup.select('.sp-c-fixture')
            results = []

            for match in matches[:10]: # Top 10 resultados
                try:
                    home = match.select_one('.sp-c-fixture__team-name--home .qa-full-team-name').text.strip()
                    away = match.select_one('.sp-c-fixture__team-name--away .qa-full-team-name').text.strip()
                    score_home = match.select_one('.sp-c-fixture__number--home').text.strip()
                    score_away = match.select_one('.sp-c-fixture__number--away').text.strip()
                    
                    results.append(f"{home} {score_home} - {score_away} {away}")
                except:
                    continue

            self._cache = results if results else ["SIN EVENTOS EN VIVO"]
            self._last_update = time.time()
            return self._cache
            
        except Exception as e:
            print(f"❌ Error en Sports Engine: {e}")
            return ["ERROR DE SINCRONIZACIÓN DEPORTIVA"]

sports_engine = SportsService()