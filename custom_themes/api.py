import frappe

from custom_themes.utils import (
	ESPRESSO_LINE_ICONS,
	ESPRESSO_SOLID_ICONS,
	TIMELESS_ICONS,
	LUCIDE_ICONS,
	get_short_icon_catalogue,
	get_theme_settings,
)


def has_app_permission():
	return frappe.has_permission("Custom Theme Settings", throw=False)


@frappe.whitelist(allow_guest=True)
def get_public_settings():
	"""Return theme settings (safe for unauthenticated website visitors).

	Icon override files are forced public on save (see
	CustomThemeSettings.make_attachments_public), so it is safe to
	include them for guests — otherwise website icons would never
	change for logged-out visitors."""
	return get_theme_settings()


@frappe.whitelist()
def get_icon_list():
	"""Return the catalogue of built-in Frappe icon names.

	Returns both the legacy full-name lists (for SVG preview rendering)
	and a ``catalogue`` list of ``{short, full, set}`` dicts that the
	icon picker uses to display short names while keeping the full name
	available for SVG preview via ``frappe.utils.icon(full_name)``.
	"""
	return {
		"espresso_line": ESPRESSO_LINE_ICONS,
		"espresso_solid": ESPRESSO_SOLID_ICONS,
		"timeless": TIMELESS_ICONS,
		"lucide": LUCIDE_ICONS,
		"catalogue": get_short_icon_catalogue(),
	}
