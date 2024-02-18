<?php

namespace Hamen\Core\Firebase;

require_once __DIR__ . "/src/Firebase.php";

use Hamen\Core\Firebase\Internal\Firebase;

function instantiateFirebase(): Firebase {
    return new Firebase(
        $_ENV["FIREBASE_API_KEY"],
        $_ENV["FIREBASE_AUTH_DOMAIN"],
        $_ENV["FIREBASE_DATABASE_URL"],
        $_ENV["FIREBASE_PROJECT_ID"],
        $_ENV["FIREBASE_STORAGE_BUCKET"],
        $_ENV["FIREBASE_MESSAGING_SENDER_ID"],
        $_ENV["FIREBASE_APP_ID"],
        $_ENV["FIREBASE_SECRET_KEY"]
    );
}
