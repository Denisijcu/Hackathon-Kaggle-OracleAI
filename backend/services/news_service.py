import feedparser
from datetime import datetime


class NewsService:
    def __init__(self):
        # Fuentes tácticas (puedes añadir las que quieras)
        self.feeds = {
            "tech": "https://feeds.feedburner.com/TheHackersNews",
            "world": "https://www.reutersagency.com/feed/?best-topics=political-news",
            "science": "https://www.nasa.gov/rss/dyn/breaking_news.rss"
        }

    def get_latest_context(self, category="world"):
        """Extrae las últimas 5 noticias para inyectar al LLM"""
        url = self.feeds.get(category, self.feeds["world"])
        feed = feedparser.parse(url)
        
        context = ""
        for entry in feed.entries[:5]: # Solo las top 5 para no saturar el prompt
            context += f"- TITULAR: {entry.title}\n  RESUMEN: {entry.summary[:200]}...\n\n"
        
        return context if context else "No hay noticias recientes disponibles."

news_engine = NewsService()