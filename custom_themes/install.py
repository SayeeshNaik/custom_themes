import frappe

from custom_themes.utils import DEFAULTS


def after_install():
	doc = frappe.get_single("Custom Theme Settings")
	for key, value in DEFAULTS.items():
		if key in ("icon_overrides", "desk_icon_overrides"):
			continue  # child tables, skip
		if doc.get(key) in (None, ""):
			doc.set(key, value)
	doc.save(ignore_permissions=True)

	frappe.db.commit()
