import frappe
from frappe.model.document import Document

from custom_themes.utils import get_theme_settings, get_icon_aliases

ALLOWED_ICON_EXTENSIONS = ("svg", "png", "jpg", "jpeg", "gif", "webp")

# Attach fields whose files must be public, otherwise other users /
# guests get a 403 and the image silently never shows.
PUBLIC_FILE_FIELDS = ("custom_logo", "custom_favicon", "login_bg_image")


def ensure_public_file(file_url):
	"""If file_url points to a private file, flip it to public and
	return the new public URL. Returns the URL unchanged otherwise."""
	if not file_url or not file_url.startswith("/private/files/"):
		return file_url

	file_name = frappe.db.get_value("File", {"file_url": file_url}, "name")
	if not file_name:
		return file_url

	file_doc = frappe.get_doc("File", file_name)
	file_doc.is_private = 0
	file_doc.save(ignore_permissions=True)
	return file_doc.file_url


class CustomThemeSettings(Document):
	def validate(self):
		self.validate_font_url()
		self.validate_icon_multiplier()
		self.make_attachments_public()
		self.validate_icon_overrides()
		self.validate_desk_icon_overrides()

	def validate_font_url(self):
		if self.google_font_url and "fonts.googleapis.com" not in self.google_font_url:
			frappe.throw("Google Font URL should be a valid fonts.googleapis.com link")

	def validate_icon_multiplier(self):
		if self.icon_size_multiplier and (
			self.icon_size_multiplier < 0.5 or self.icon_size_multiplier > 3.0
		):
			frappe.throw("Icon Size Multiplier must be between 0.5 and 3.0")

	def make_attachments_public(self):
		"""Branding images and replacement icons must be publicly
		readable — they render for every user including the login page."""
		for fieldname in PUBLIC_FILE_FIELDS:
			value = self.get(fieldname)
			if value:
				self.set(fieldname, ensure_public_file(value))

		for row in self.icon_overrides or []:
			if row.custom_icon:
				row.custom_icon = ensure_public_file(row.custom_icon)

		for row in self.desk_icon_overrides or []:
			if row.custom_icon:
				row.custom_icon = ensure_public_file(row.custom_icon)

	def validate_icon_overrides(self):
		seen = set()
		for row in self.icon_overrides or []:
			if not row.icon_name:
				frappe.throw(f"Icon Replacements, Row {row.idx}: Please set the Standard Icon name")

			row.icon_name = row.icon_name.strip()

			if not row.custom_icon:
				frappe.throw(
					f"Icon Replacements, Row {row.idx} ({row.icon_name}): "
					"Please upload a Replacement Icon file"
				)

			if row.icon_name in seen:
				frappe.throw(
					f"Icon Replacements, Row {row.idx}: Duplicate icon '{row.icon_name}'. "
					"Each icon can only be overridden once."
				)
			seen.add(row.icon_name)

			ext = (row.custom_icon or "").rsplit(".", 1)[-1].lower().split("?")[0]
			if ext not in ALLOWED_ICON_EXTENSIONS:
				frappe.throw(
					f"Icon Replacements, Row {row.idx} ({row.icon_name}): "
					"Replacement must be SVG, PNG, JPG, GIF, or WebP"
				)

	def validate_desk_icon_overrides(self):
		seen = set()
		for row in self.desk_icon_overrides or []:
			if not row.app_name:
				frappe.throw(f"Desk Icon Overrides, Row {row.idx}: Please set the App Name")

			row.app_name = row.app_name.strip()

			if not row.custom_icon:
				frappe.throw(
					f"Desk Icon Overrides, Row {row.idx} ({row.app_name}): "
					"Please upload a Custom Icon file"
				)

			if row.app_name in seen:
				frappe.throw(
					f"Desk Icon Overrides, Row {row.idx}: Duplicate app '{row.app_name}'. "
					"Each app can only be overridden once."
				)
			seen.add(row.app_name)

			ext = (row.custom_icon or "").rsplit(".", 1)[-1].lower().split("?")[0]
			if ext not in ALLOWED_ICON_EXTENSIONS:
				frappe.throw(
					f"Desk Icon Overrides, Row {row.idx} ({row.app_name}): "
					"Replacement must be SVG, PNG, JPG, GIF, or WebP"
				)

	def on_update(self):
		frappe.clear_cache()

		# Push updated settings to all connected browsers so the theme
		# refreshes instantly without requiring a hard reload.
		settings = get_theme_settings()
		settings["icon_aliases"] = get_icon_aliases()
		frappe.publish_realtime(
			"custom_theme_updated",
			{"settings": settings},
			after_commit=True,
		)
