import frappe

from custom_themes.utils import DEFAULTS


def after_install():
	doc = frappe.get_single("Custom Theme Settings")
	for key, value in DEFAULTS.items():
		if key == "icon_overrides":
			continue  # child table, skip
		if doc.get(key) in (None, ""):
			doc.set(key, value)
	doc.save(ignore_permissions=True)
	frappe.db.commit()
