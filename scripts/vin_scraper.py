"""
VIN Scraper — raspa VINs de múltiples fuentes web
==================================================
Fuentes (en orden de prioridad):
  1. randomvin.com      — API directa (type=real / type=fake)
  2. vingenerator.org   — scraping HTML
  3. ivinapi.com        — API directa
  4. Generador local    — fallback sin red (ISO 3779, siempre disponible)

Dependencias:
  pip install requests beautifulsoup4

Uso:
  python vin_scraper.py                        # 10 VINs, fuente automática
  python vin_scraper.py -n 20                  # 20 VINs
  python vin_scraper.py --source randomvin     # forzar fuente
  python vin_scraper.py --source vingenerator
  python vin_scraper.py --source ivinapi
  python vin_scraper.py --source local         # sin red
  python vin_scraper.py -n 10 --nhtsa          # verificar WMI con NHTSA
  python vin_scraper.py -n 10 --json           # salida JSON
  python vin_scraper.py -n 50 --no-header      # solo VINs
  python vin_scraper.py --validate 1HGBH41JXMN109186
"""

import argparse, json, random, sys, time
import urllib.parse, urllib.request

try:
    import requests
    from bs4 import BeautifulSoup
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

# ─────────────────────────────────────────────────────────────────────────────
# Validación local ISO 3779
# ─────────────────────────────────────────────────────────────────────────────

ALLOWED  = "0123456789ABCDEFGHJKLMNPRSTUVWXYZ"
LETTERS  = "ABCDEFGHJKLMNPRSTUVWXYZ"
DIGITS   = "0123456789"
TRANSLIT = {
    "A":1,"B":2,"C":3,"D":4,"E":5,"F":6,"G":7,"H":8,
    "J":1,"K":2,"L":3,"M":4,"N":5,"P":7,
    "R":9,"S":2,"T":3,"U":4,"V":5,"W":6,"X":7,"Y":8,"Z":9,
}
WEIGHTS = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2]
YEAR_CHARS = "ABCDEFGHJKLMNPRSTUVWXY123456789ABCDEFGHJKLMNPRSTUVWXY"
WMI_LIST   = [
    "1HG","1G1","1GT","1N4","1FA","1FT","1FM",
    "2G1","2T1","2HG",
    "3VW","3FA","3N1",
    "4T1","4T3","4US",
    "5YJ","5NP","5TD",
    "WBA","WDB","WAU","WVW","WP0",
    "YV1","SAJ","SCB","SAL",
    "JHM","JTD","JN1","JA3",
    "KMH","KNA","KND",
]

def _val(c):
    return int(c) if c.isdigit() else TRANSLIT[c]

def check_digit(v16):
    full  = v16[:8] + "0" + v16[8:]
    total = sum(_val(c) * WEIGHTS[i] for i, c in enumerate(full))
    r     = total % 11
    return "X" if r == 10 else str(r)

def validate_local(vin):
    if len(vin) != 17: return False, "longitud ≠ 17"
    vin = vin.upper()
    bad = [c for c in vin if c not in ALLOWED]
    if bad: return False, f"caracteres inválidos: {bad}"
    exp = check_digit(vin[:8] + vin[9:])
    if vin[8] != exp: return False, f"check digit '{vin[8]}' incorrecto, esperado '{exp}'"
    return True, "OK"

def _make_vin(wmi=None):
    w   = (wmi or random.choice(WMI_LIST)).upper()[:3]
    vds = "".join(random.choice(ALLOWED) for _ in range(5))
    yr  = random.choice(YEAR_CHARS)
    pl  = random.choice(LETTERS + DIGITS)
    sn  = "".join(random.choice(DIGITS) for _ in range(6))
    v16 = w + vds + yr + pl + sn
    return v16[:8] + check_digit(v16) + v16[8:]

# ─────────────────────────────────────────────────────────────────────────────
# Fuentes de scraping
# ─────────────────────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/json,*/*;q=0.9",
}
TIMEOUT = 10


def _get(url, **kwargs):
    """GET con requests; lanza excepción si no está disponible."""
    if not HAS_REQUESTS:
        raise RuntimeError("requests no instalado — ejecuta: pip install requests beautifulsoup4")
    return requests.get(url, headers=HEADERS, timeout=TIMEOUT, **kwargs)


# ── Fuente 1: randomvin.com ──────────────────────────────────────────────────

def scrape_randomvin(vin_type="real"):
    """
    API directa: GET http://randomvin.com/getvin.php?type=real|fake
    Devuelve el VIN como texto plano.
    """
    url = f"http://randomvin.com/getvin.php?type={vin_type}"
    r   = _get(url)
    r.raise_for_status()
    vin = r.text.strip().upper()
    if len(vin) == 17:
        return vin
    raise ValueError(f"Respuesta inesperada de randomvin.com: {r.text!r}")


# ── Fuente 2: vingenerator.org ───────────────────────────────────────────────

def scrape_vingenerator():
    """
    Hace POST al endpoint de generación de vingenerator.org.
    El sitio expone una petición XHR que devuelve VINs en HTML o JSON.
    """
    # Primero cargamos la página para obtener cualquier token CSRF / cookie
    session = requests.Session()
    session.headers.update(HEADERS)

    home = session.get("https://vingenerator.org/", timeout=TIMEOUT)
    home.raise_for_status()

    # Intentar endpoint JSON conocido
    api_url = "https://vingenerator.org/api/generate"
    resp = session.post(api_url, json={"count": 1}, timeout=TIMEOUT)
    if resp.ok:
        try:
            data = resp.json()
            # Buscar el VIN en la respuesta (estructura varía)
            for key in ("vin", "VIN", "result", "vins"):
                val = data.get(key)
                if isinstance(val, str) and len(val) == 17:
                    return val.upper()
                if isinstance(val, list) and val:
                    return str(val[0]).upper()
        except Exception:
            pass

    # Fallback: parsear el HTML generado
    soup = BeautifulSoup(home.text, "html.parser")
    for selector in ("#vin", ".vin", "[data-vin]", "span.result", "div.vin"):
        el = soup.select_one(selector)
        if el:
            candidate = el.get_text(strip=True).upper()
            if len(candidate) == 17:
                return candidate

    raise ValueError("No se pudo extraer VIN de vingenerator.org")


# ── Fuente 3: ivinapi.com ────────────────────────────────────────────────────

def scrape_ivinapi():
    """
    GET https://ivinapi.com/random-vin
    Devuelve JSON con campo 'vin'.
    """
    r = _get("https://ivinapi.com/random-vin")
    r.raise_for_status()
    data = r.json()
    vin  = (data.get("vin") or data.get("VIN") or "").strip().upper()
    if len(vin) == 17:
        return vin
    raise ValueError(f"Respuesta inesperada de ivinapi.com: {data}")


# ── Fuente 4: local (fallback) ───────────────────────────────────────────────

def scrape_local():
    return _make_vin()


# ─────────────────────────────────────────────────────────────────────────────
# Dispatcher de fuentes
# ─────────────────────────────────────────────────────────────────────────────

SOURCES = {
    "randomvin":    lambda: scrape_randomvin("real"),
    "vingenerator": scrape_vingenerator,
    "ivinapi":      scrape_ivinapi,
    "local":        scrape_local,
}

SOURCE_ORDER = ["randomvin", "vingenerator", "ivinapi", "local"]


def fetch_one(source=None, verbose=True):
    """
    Intenta obtener un VIN de la fuente indicada.
    Si source=None, prueba todas en orden hasta que una funcione.
    Devuelve (vin, source_name) o lanza excepción.
    """
    order = [source] if source else SOURCE_ORDER

    for src in order:
        fn = SOURCES.get(src)
        if not fn:
            raise ValueError(f"Fuente desconocida: {src}. Opciones: {list(SOURCES)}")
        try:
            vin = fn()
            ok, msg = validate_local(vin)
            if not ok:
                raise ValueError(f"VIN inválido ({msg}): {vin}")
            return vin, src
        except Exception as e:
            if verbose:
                print(f"  ⚠️  [{src}] {e}", flush=True)
            if source:   # si se forzó una fuente, no hacer fallback
                raise
            continue

    raise RuntimeError("Todas las fuentes fallaron.")


def fetch_many(count, source=None, verbose=True, delay=0.2):
    """Obtiene `count` VINs únicos."""
    collected = {}   # vin → source_name
    errors    = 0
    max_errors = count * 10

    if verbose:
        src_label = source or "auto (randomvin → vingenerator → ivinapi → local)"
        print(f"\n  Fuente  : {src_label}")
        print(f"  Objetivo: {count} VINs\n", flush=True)

    while len(collected) < count:
        try:
            vin, src = fetch_one(source=source, verbose=False)
            if vin not in collected:
                collected[vin] = src
                if verbose:
                    pct = int(len(collected) / count * 28)
                    bar = "█" * pct + "░" * (28 - pct)
                    print(f"\r  [{bar}] {len(collected)}/{count}  última fuente: {src}",
                          end="", flush=True)
        except Exception as e:
            errors += 1
            if errors >= max_errors:
                print(f"\n  ❌ Demasiados errores ({errors}). Abortando.")
                break

        time.sleep(delay)

    if verbose:
        print()  # salto tras la barra
    return list(collected.items())[:count]   # [(vin, source), ...]


# ─────────────────────────────────────────────────────────────────────────────
# NHTSA
# ─────────────────────────────────────────────────────────────────────────────

NHTSA_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValuesBatch/"

class NHTSAResult:
    def __init__(self, vin, make="", model="", year="",
                 ok=None, ecode="", etext=""):
        self.vin=vin; self.make=make; self.model=model; self.year=year
        self.ok=ok; self.ecode=ecode; self.etext=etext

def _nhtsa_post(vins):
    body = urllib.parse.urlencode({"DATA":";".join(vins),"format":"json"}).encode()
    req  = urllib.request.Request(NHTSA_URL, data=body, method="POST",
               headers={"Content-Type":"application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=12) as r:
        return json.loads(r.read())["Results"]

def _accept(row):
    make  = (row.get("Make") or "").strip()
    codes = {c.strip() for c in str(row.get("ErrorCode","")).split(",")}
    return bool(make) and not (codes & {"4","7"})

def nhtsa_verify(vins, verbose=True):
    out     = {}
    batches = [vins[i:i+50] for i in range(0,len(vins),50)]
    for bi, batch in enumerate(batches, 1):
        if verbose and len(batches) > 1:
            print(f"  NHTSA lote {bi}/{len(batches)}...", flush=True)
        for attempt in range(1, 3):
            try:
                for row in _nhtsa_post(batch):
                    v = row.get("VIN","").upper()
                    out[v] = NHTSAResult(
                        vin=v, make=(row.get("Make") or "").strip(),
                        model=(row.get("Model") or "").strip(),
                        year=(row.get("ModelYear") or "").strip(),
                        ok=_accept(row),
                        ecode=str(row.get("ErrorCode","")).split(",")[0].strip(),
                        etext=(row.get("ErrorText") or "").strip(),
                    )
                break
            except Exception as e:
                if attempt == 2:
                    for v in batch:
                        out[v] = NHTSAResult(v, ok=False, etext=f"Error red: {e}")
                else:
                    time.sleep(1.5)
    return out

# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(
        description="Scraper de VINs — raspa múltiples fuentes web con fallback local"
    )
    p.add_argument("-n","--count", type=int, default=10,
                   help="Cantidad de VINs (default: 10)")
    p.add_argument("--source", choices=list(SOURCES), default=None,
                   help="Fuente forzada. Sin esto: prueba todas en orden.")
    p.add_argument("--nhtsa", action="store_true",
                   help="Verificar WMI con NHTSA tras el scraping")
    p.add_argument("--validate", type=str, default=None,
                   help="Valida un VIN existente (local + NHTSA)")
    p.add_argument("--no-header", action="store_true",
                   help="Solo VINs, sin tabla")
    p.add_argument("--json", action="store_true",
                   help="Salida JSON")
    p.add_argument("--js", action="store_true",
                   help="Salida como array JS para copy-paste en TEST_VINS")
    p.add_argument("--delay", type=float, default=0.2,
                   help="Segundos entre peticiones (default: 0.2)")
    a = p.parse_args()

    # ── Modo validación ──────────────────────────────────────────────────────
    if a.validate:
        vin = a.validate.strip().upper()
        print(f"\nValidando: {vin}")
        print("─" * 50)
        ok, msg = validate_local(vin)
        print(f"  Check digit local : {'✅ OK' if ok else f'❌  {msg}'}")
        print("  Consultando NHTSA...", flush=True)
        nm = nhtsa_verify([vin], verbose=False)
        r  = nm.get(vin)
        if r:
            print(f"  NHTSA WMI         : {'✅ registrado' if r.ok else f'❌  código {r.ecode}'}")
            if r.make:  print(f"  Fabricante        : {r.make}")
            if r.model: print(f"  Modelo / Año      : {r.model}  {r.year}")
            if not r.ok and r.etext:
                print(f"  Detalle           : {r.etext[:80]}")
        print("─" * 50)
        return

    # ── Modo scraping ────────────────────────────────────────────────────────
    verbose = not a.no_header and not a.json and not a.js

    if not HAS_REQUESTS and a.source != "local" and a.source is not None:
        print("⚠️  requests no instalado. Usando generador local.")
        print("    Instala con: pip install requests beautifulsoup4\n")

    pairs  = fetch_many(a.count, source=a.source, verbose=verbose, delay=a.delay)
    vins   = [v for v, _ in pairs]
    src_of = dict(pairs)

    if not vins:
        print("No se obtuvieron VINs.", file=sys.stderr)
        sys.exit(1)

    # NHTSA opcional
    nm = {}
    if a.nhtsa:
        if verbose: print("\n  Verificando con NHTSA...", flush=True)
        nm = nhtsa_verify(vins, verbose=verbose)

    # ── Salida JS ────────────────────────────────────────────────────────────
    if a.js:
        lines = [f"  {{ vin: '{vin}' }}," for vin in vins]
        print("const TEST_VINS = [")
        print("\n".join(lines))
        print("];")
        return

    # ── Salida JSON ──────────────────────────────────────────────────────────
    if a.json:
        output = []
        for vin in vins:
            nr = nm.get(vin)
            output.append({
                "vin":            vin,
                "source":         src_of.get(vin,""),
                "make":           nr.make  if nr else "",
                "model":          nr.model if nr else "",
                "year":           nr.year  if nr else "",
                "nhtsa_verified": nr.ok    if nr else None,
            })
        print(json.dumps(output, indent=2, ensure_ascii=False))
        return

    # ── Solo VINs ────────────────────────────────────────────────────────────
    if a.no_header:
        for vin in vins: print(vin)
        return

    # ── Tabla ────────────────────────────────────────────────────────────────
    # Formato: {i:<5}{vin:<19}{wmi:<6}{year_char:<6}{source}  [+NHTSA]
    # Ejemplo:  1    1G8AL54F04Z107715  1G8   4     randomvin
    for i, vin in enumerate(vins, 1):
        src = src_of.get(vin, "?")
        row = f"{i:<5}{vin:<19}{vin[:3]:<6}{vin[9]:<6}{src}"
        if a.nhtsa:
            nr = nm.get(vin)
            if nr:
                row += f"   {'✅' if nr.ok else '❌'}  {nr.make}"
        print(row)


if __name__ == "__main__":
    main()