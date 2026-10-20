"""Chargement de la configuration (fichiers TOML du dossier config/)."""

from __future__ import annotations

import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = ROOT / "config"


def load_toml(name: str) -> dict:
    with open(CONFIG_DIR / name, "rb") as f:
        return tomllib.load(f)


def settings() -> dict:
    return load_toml("settings.toml")


def products() -> dict:
    return load_toml("products.toml")
