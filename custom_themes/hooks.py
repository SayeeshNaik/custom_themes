app_name = "custom_themes"
app_title = "Custom Themes"
app_publisher = "Sayeesh"
app_description = "Customize Frappe icons, fonts and theme colors"
app_email = "admin@example.com"
app_license = "mit"

add_to_apps_screen = [
	{
		"name": "custom_themes",
		"logo": "/assets/custom_themes/images/custom_themes.svg",
		"title": "Custom Themes",
		"route": "/app/custom-theme-settings",
		"has_permission": "custom_themes.api.has_app_permission",
	}
]

app_include_css = "/assets/custom_themes/css/custom_themes.css"
app_include_js = "/assets/custom_themes/js/custom_themes.js"

web_include_css = "/assets/custom_themes/css/custom_themes.css"
web_include_js = "/assets/custom_themes/js/custom_themes.js"

boot_session = "custom_themes.boot.get_boot_data"

after_install = "custom_themes.install.after_install"
