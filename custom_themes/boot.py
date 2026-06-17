import frappe

from custom_themes.utils import get_theme_settings, get_icon_aliases


def get_boot_data(bootinfo):
	bootinfo.custom_theme_settings = get_theme_settings()
	bootinfo.custom_theme_settings["icon_aliases"] = get_icon_aliases()
