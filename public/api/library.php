<?php
// ─── Configuration ────────────────────────────────────────────────────────────
require_once __DIR__ . '/config.php';
define('DATA_FILE', __DIR__ . '/data.json');
define('COVERS_DIR', __DIR__ . '/covers');

// ─── Headers ─────────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── Auth (lectures publiques, écritures protégées) ───────────────────────────
$isWrite = $_SERVER['REQUEST_METHOD'] !== 'GET' || isset($_GET['cover']);
if ($isWrite) {
    $token = $_SERVER['HTTP_X_TOKEN'] ?? '';
    if ($token !== TOKEN) {
        http_response_code(401);
        echo json_encode(['error' => 'Non autorisé']);
        exit;
    }
}

// ─── Couvertures ─────────────────────────────────────────────────────────────
$cover_id = $_GET['cover'] ?? null;

if ($cover_id !== null) {
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $cover_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'ID invalide']);
        exit;
    }

    // ─── DELETE cover ──────────────────────────────────────────────────────
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        foreach (glob(COVERS_DIR . '/' . $cover_id . '.*') ?: [] as $old) {
            unlink($old);
        }
        echo json_encode(['ok' => true]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
        exit;
    }

    if (!is_dir(COVERS_DIR)) mkdir(COVERS_DIR, 0755, true);

    foreach (glob(COVERS_DIR . '/' . $cover_id . '.*') ?: [] as $old) {
        unlink($old);
    }

    $from_url = $_GET['from'] ?? null;

    if ($from_url !== null) {
        // ─── Téléchargement server-side depuis une source autorisée ───────────
        $parsed = parse_url($from_url);
        $host   = $parsed['host'] ?? '';

        $allowed = [
            '/(?:^|\.)openlibrary\.org$/',
            '/(?:^|\.)books\.google\.com$/',
            '/(?:^|\.)googleapis\.com$/',
        ];
        $hostAllowed = false;
        foreach ($allowed as $pattern) {
            if (preg_match($pattern, $host)) { $hostAllowed = true; break; }
        }
        if (!$hostAllowed) {
            http_response_code(400);
            echo json_encode(['error' => 'URL non autorisée']);
            exit;
        }

        $body = coverFetch($from_url);

        if ($body === false || $body === '') {
            http_response_code(502);
            echo json_encode(['error' => 'Téléchargement impossible']);
            exit;
        }

        $ext = 'jpg';
    } elseif (!empty($_FILES['file'])) {
        // ─── Upload via FormData (fallback navigateur) ────────────────────────
        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'Upload échoué']);
            exit;
        }
        $mime = strtolower($file['type'] ?? 'image/jpeg');
        $ext  = match($mime) {
            'image/png'  => 'png',
            'image/webp' => 'webp',
            default      => 'jpg',
        };
        $body = file_get_contents($file['tmp_name']);
    } else {
        // ─── Upload direct (blob dans le body) ────────────────────────────────
        $mime = strtolower(explode(';', $_SERVER['CONTENT_TYPE'] ?? 'image/jpeg')[0]);
        $ext  = match(trim($mime)) {
            'image/png'  => 'png',
            'image/webp' => 'webp',
            default      => 'jpg',
        };
        $body = file_get_contents('php://input');
    }

    $path = COVERS_DIR . '/' . $cover_id . '.' . $ext;

    if (file_put_contents($path, $body) === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Écriture impossible']);
        exit;
    }

    echo json_encode(['url' => '/api/covers/' . $cover_id . '.' . $ext]);
    exit;
}

// ─── Bibliothèque — GET ───────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists(DATA_FILE)) {
        echo json_encode(['books' => []]);
        exit;
    }
    echo file_get_contents(DATA_FILE);
    exit;
}

// ─── Bibliothèque — POST ──────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = file_get_contents('php://input');
    if (json_decode($body) === null) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON invalide']);
        exit;
    }
    if (file_put_contents(DATA_FILE, $body) === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Écriture impossible']);
        exit;
    }
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Méthode non autorisée']);

// ─── Téléchargement d'une image externe (curl ou file_get_contents) ───────────
function coverFetch(string $url): string|false
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_USERAGENT      => 'ma-bibliotheque/1.0',
        ]);
        $data     = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ($data !== false && $httpCode < 400) ? $data : false;
    }

    $ctx = stream_context_create([
        'http' => [
            'timeout'         => 10,
            'follow_location' => 1,
            'user_agent'      => 'ma-bibliotheque/1.0',
        ],
    ]);
    return @file_get_contents($url, false, $ctx);
}
