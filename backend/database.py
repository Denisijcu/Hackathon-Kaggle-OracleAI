import sqlite3
from pathlib import Path

# Ruta absoluta para entorno HP Omen / RPi5
DB_PATH = Path(__file__).parent / "oracleai.db"

def init_db():
    """Inicializa la base de datos con perfiles diversos y niveles de acceso"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Tabla de Historial
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id TEXT NOT NULL,
            type TEXT NOT NULL,
            prompt TEXT NOT NULL,
            response TEXT NOT NULL,
            file_type TEXT,
            file_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. Tabla de Perfiles (Añadido access_level)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            avatar TEXT,
            color TEXT,
            access_level INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 3. Tabla de Estadísticas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY,
            total_queries INTEGER DEFAULT 0,
            education_queries INTEGER DEFAULT 0,
            health_queries INTEGER DEFAULT 0,
            documents_processed INTEGER DEFAULT 0,
            avg_response_time REAL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 4. ✅ SINCRONIZACIÓN DE PERFILES (Claves de traducción + Niveles)
    # Cambiamos 'caregiver' por 'parent'/'aunt' para que Angular los traduzca
    perfiles_base = [
        ('1', 'Mateo', 'child', '👦', '#FF9F1C', 1),
        ('2', 'Maria', 'elder', '👵', '#7C9E7C', 1),
        ('3', 'Papa', 'parent', '👨', '#118AB2', 2),
        ('4', 'Elena', 'child', '👧', '#E91E63', 1),
        ('5', 'Chen', 'elder', '👴', '#8D6E63', 2),
        ('6', 'Amara', 'aunt', '👩🏾', '#9C27B0', 3) # Oracle Mode
    ]
    
    # Usamos INSERT OR REPLACE para que si el registro existe, se actualice el nivel
    cursor.executemany('''
        INSERT OR REPLACE INTO profiles (id, name, role, avatar, color, access_level)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', perfiles_base)

    # 5. INICIALIZACIÓN DE ESTADÍSTICAS
    cursor.execute('SELECT id FROM stats WHERE id = 1')
    if not cursor.fetchone():
        cursor.execute('INSERT INTO stats (id) VALUES (1)')

    conn.commit()
    conn.close()
    print(f"✅ Base de Datos Vertex Sincronizada: {DB_PATH}")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Tu lógica de auto-ejecución blindada
if __name__ == "__main__":
    init_db()
else:
    init_db()