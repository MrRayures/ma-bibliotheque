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
    // Valider le format UUID
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $cover_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'ID invalide']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
        exit;
    }

    if (!is_dir(COVERS_DIR)) mkdir(COVERS_DIR, 0755, true);

    $mime = strtolower(explode(';', $_SERVER['CONTENT_TYPE'] ?? 'image/jpeg')[0]);
    $ext = match(trim($mime)) {
        'image/png'  => 'png',
        'image/webp' => 'webp',
        default      => 'jpg',
    };

    // Supprimer l'ancienne couverture si extension différente
    foreach (glob(COVERS_DIR . '/' . $cover_id . '.*') ?: [] as $old) {
        unlink($old);
    }

    $body = file_get_contents('php://input');
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
