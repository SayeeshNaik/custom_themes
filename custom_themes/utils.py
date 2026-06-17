import frappe

DEFAULTS = {
	"enabled": 1,
	"apply_to_desk": 1,
	"apply_to_website": 1,
	# Main Theme preset
	"main_theme": "",
	# Section: Theme Colors
	"enable_theme_colors": 0,
	"primary_color": "#7C3AED",
	"secondary_color": "#06B6D4",
	"accent_color": "#F59E0B",
	"icon_color": "#7C3AED",
	# Section: Navbar & Sidebar
	"enable_navbar_sidebar": 0,
	"navbar_bg_color": "",
	"navbar_text_color": "",
	"sidebar_bg_color": "",
	"sidebar_text_color": "",
	"sidebar_active_bg_color": "",
	# Section: Typography
	"enable_typography": 0,
	"font_family": "Poppins",
	"heading_font": "Poppins",
	"google_font_url": "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
	"font_size_base": "14px",
	"text_color": "#1E293B",
	"heading_color": "",
	"link_color": "",
	"text_muted_color": "",
	# Section: Layout & Surfaces
	"enable_layout": 0,
	"background_color": "#F8FAFC",
	"card_bg_color": "",
	"control_bg_color": "",
	"border_color": "",
	"border_radius": "Medium",
	"card_shadow": "Subtle",
	# Section: Buttons
	"enable_buttons": 0,
	"btn_primary_text_color": "#FFFFFF",
	"btn_primary_hover_color": "",
	# Section: Status Colors
	"enable_status_colors": 0,
	"success_color": "#30A66D",
	"danger_color": "#E03636",
	"warning_color": "#E86C13",
	"info_color": "#0289F7",
	# Section: Branding & Login
	"enable_branding": 0,
	"custom_logo": "",
	"custom_favicon": "",
	"login_bg_color": "",
	"login_bg_image": "",
	# Section: Icon Overrides
	"enable_icon_overrides": 0,
	"icon_size_multiplier": 1.0,
	# Section: Dialogs & Popups
	"enable_dialogs": 0,
	"modal_header_bg": "",
	"modal_header_text": "",
	"modal_backdrop_blur": 0,
	"modal_animation": "Fade",
	# Section: Header & Footer
	"enable_header_footer": 0,
	"header_bg_color": "",
	"header_text_color": "",
	"header_border_color": "",
	"sticky_header": 0,
	"footer_bg_color": "",
	"footer_text_color": "",
	"footer_link_color": "",
	"announcement_text": "",
	"announcement_bg_color": "#7C3AED",
	"announcement_text_color": "#FFFFFF",
	"footer_custom_html": "",
	# Section: Animations
	"enable_animations": 0,
	"animation_speed": "Normal",
	"page_transition": "Fade",
	"hover_lift_cards": 1,
	"button_press_effect": 1,
	# Section: List View
	"enable_listview": 0,
	"list_hover_bg": "",
	"list_header_bg": "",
	"list_striped": 0,
	# Section: Form View
	"enable_formview": 0,
	"form_section_bg": "",
	"form_section_text": "",
	# Section: Scrollbar
	"enable_scrollbar": 0,
	"scrollbar_thumb": "",
	"scrollbar_track": "",
	# Section: Tables
	"enable_tables": 0,
	"table_header_bg": "",
	"table_striped": 0,
	# Section: Dark Mode
	"dark_mode_overrides": 0,
	"dark_bg_color": "",
	"dark_card_bg_color": "",
	"dark_text_color": "",
	"dark_primary_color": "",
	"dark_navbar_bg_color": "",
	# Advanced
	"custom_css": "",
}

# All color/text fields to sync (no child tables or complex fields)
SIMPLE_FIELDS = [k for k in DEFAULTS.keys()]


def get_theme_settings():
	settings = dict(DEFAULTS)

	# "Custom Theme Settings" is a Single DocType — its data lives in
	# `tabSingles`, NOT in its own table.
	if not frappe.db.exists("DocType", "Custom Theme Settings"):
		return settings

	try:
		doc = frappe.get_single("Custom Theme Settings")
		for key in SIMPLE_FIELDS:
			if hasattr(doc, key):
				value = doc.get(key)
				if value not in (None, ""):
					settings[key] = value

		# Icon overrides — child table (Select + Attach Image + Check)
		icon_overrides = []
		if hasattr(doc, "icon_overrides") and doc.icon_overrides:
			for row in doc.icon_overrides:
				icon_overrides.append({
					"icon_name": row.icon_name,
					"custom_icon": row.custom_icon,
					"enabled": row.enabled,
				})
		settings["icon_overrides"] = icon_overrides

	except Exception:
		settings["icon_overrides"] = []

	return settings


# ── Icon catalogue ─────────────────────────────────────────────────
# Pre-built lists so the settings form can show a picker.

ESPRESSO_LINE_ICONS = [
	"es-line-activity","es-line-add","es-line-add-circle","es-line-add-emoji",
	"es-line-add-people","es-line-agent","es-line-agent-alt","es-line-alert-circle",
	"es-line-alert-triangle","es-line-align","es-line-align-center","es-line-align-justify",
	"es-line-align-right","es-line-all-apps","es-line-archive","es-line-arrow-left",
	"es-line-arrow-right","es-line-arrow-up-right","es-line-article","es-line-attachment",
	"es-line-bold","es-line-book","es-line-bullet-list","es-line-calender","es-line-call",
	"es-line-camera","es-line-certificates","es-line-chart","es-line-chat","es-line-chat-alt",
	"es-line-check","es-line-close","es-line-close-circle","es-line-cloud","es-line-code",
	"es-line-colour","es-line-compact","es-line-copy","es-line-copy-light",
	"es-line-create-ticket","es-line-cursor","es-line-customer","es-line-darkmode",
	"es-line-dash","es-line-dashboard","es-line-decrease-indent","es-line-delete",
	"es-line-delete-alt","es-line-demand-video","es-line-details","es-line-discussions",
	"es-line-dislike","es-line-divider","es-line-dot","es-line-dot-horizontal",
	"es-line-dot-vertical","es-line-double-check","es-line-down","es-line-download",
	"es-line-drag","es-line-duplicate","es-line-edit","es-line-edit-alt","es-line-email",
	"es-line-embed","es-line-emoji","es-line-expand","es-line-file-upload",
	"es-line-filetype","es-line-filter","es-line-folder","es-line-folder-alt",
	"es-line-folder-shared","es-line-folder-upload","es-line-globe","es-line-group",
	"es-line-header-column","es-line-header-row","es-line-heart","es-line-hide",
	"es-line-home","es-line-image","es-line-image-alt1","es-line-inbox",
	"es-line-increase-indent","es-line-italic","es-line-laptop","es-line-left-chevron",
	"es-line-like","es-line-link","es-line-location","es-line-lock","es-line-log-out",
	"es-line-manage","es-line-mark-unread","es-line-minimise","es-line-mobile",
	"es-line-move","es-line-new-folder","es-line-nextweek","es-line-notes",
	"es-line-notifications","es-line-notifications-unseen","es-line-numbered-list",
	"es-line-overdue","es-line-overflow","es-line-pages","es-line-pages-alt",
	"es-line-payments","es-line-pentagon","es-line-people","es-line-pin","es-line-plan",
	"es-line-plans","es-line-preview","es-line-privacy-alt","es-line-progress",
	"es-line-question","es-line-quiz","es-line-quote","es-line-quotes-alt",
	"es-line-reload","es-line-reply","es-line-reply-all","es-line-reports",
	"es-line-resizer","es-line-restrictions","es-line-right-chevron","es-line-search",
	"es-line-security","es-line-select","es-line-select-file","es-line-settings",
	"es-line-share","es-line-sidebar-collapse","es-line-sidebar-expand","es-line-slash",
	"es-line-sort","es-line-sparkle","es-line-square","es-line-star","es-line-status",
	"es-line-storage","es-line-strike-through","es-line-success","es-line-support",
	"es-line-table-view","es-line-tag","es-line-teams","es-line-template",
	"es-line-text-cursor","es-line-tick","es-line-ticket","es-line-ticket-alt",
	"es-line-tiles","es-line-time","es-line-title","es-line-today","es-line-today-alt",
	"es-line-tomorrow","es-line-unarchive","es-line-underline","es-line-unlock",
	"es-line-unpin","es-line-up","es-line-upload","es-line-video","es-line-web",
	"es-line-web-link","es-line-weekend","es-line-wifi-off","es-line-youtube","es-line-zap",
]

ESPRESSO_SOLID_ICONS = [
	"es-solid-aftereffects","es-solid-agent","es-solid-alert-circle",
	"es-solid-alert-triangle","es-solid-apple","es-solid-arrow-up","es-solid-audio",
	"es-solid-black","es-solid-book","es-solid-calendar","es-solid-close-circle",
	"es-solid-color-wheel","es-solid-customer","es-solid-dashboard","es-solid-details",
	"es-solid-doc","es-solid-dot","es-solid-down","es-solid-dropbox","es-solid-everyone",
	"es-solid-excel","es-solid-external-link","es-solid-facebook","es-solid-fire",
	"es-solid-folder","es-solid-folder-alt","es-solid-github","es-solid-google",
	"es-solid-heading","es-solid-heart","es-solid-home","es-solid-illustrator",
	"es-solid-image","es-solid-inprogress","es-solid-knob","es-solid-left",
	"es-solid-lighting","es-solid-link","es-solid-location","es-solid-location-alt",
	"es-solid-music","es-solid-notes","es-solid-notification","es-solid-organization",
	"es-solid-pdf","es-solid-people","es-solid-photoshop","es-solid-pin","es-solid-play",
	"es-solid-quiz","es-solid-report","es-solid-right","es-solid-search",
	"es-solid-settings","es-solid-shared-folder","es-solid-shared-folder-alt",
	"es-solid-sketch","es-solid-stage","es-solid-star","es-solid-success","es-solid-tag",
	"es-solid-text","es-solid-text-alt","es-solid-ticket","es-solid-ticket-alt",
	"es-solid-title","es-solid-type","es-solid-up","es-solid-user","es-solid-video",
	"es-solid-white","es-solid-word","es-solid-youtube","es-solid-zip",
]

TIMELESS_ICONS = [
	"accounting","add","add-round","agriculture","assets","assign","attachment","both",
	"branch","buying","call","card","change","chart","clap","close","close-alt","collapse",
	"comment","criticize","crm","customer","customization","dashboard","dashboard-list",
	"delete-active","dialpad","dot-horizontal","dot-vertical","down","down-arrow","drag",
	"drag-sm","duplicate","edit","edit-fill","edit-round","education","equity","expand-alt",
	"expenses","file-large","filter","filter-x","folder-normal","folder-normal-large",
	"full-page","gantt","getting-started","google","grid","group-by","header","header-1",
	"header-2","header-3","header-4","header-5","header-6","healthcare","heart-active",
	"help","hide","home","hr","image-view","income","integration","left","liabilities",
	"link-url","list-alt","loan","logout","mark-as-read","message","message-1",
	"money-coins-1","month-view","non-profit","notification","notification-with-indicator",
	"number-card","onboarding","organization","permission","primitive-dot","project",
	"project-1","project-2","projects","quality","quality-3","quantity-1","read-status",
	"refresh","remove","restriction","retail","review","right","select","sell","setting",
	"setting-gear","shortcut","sidebar-collapse","sidebar-expand","small-add","small-down",
	"small-file","small-message","small-up","solid-error","solid-info","solid-success",
	"solid-warning","sort","sort-ascending","sort-descending","spacer","stock","support",
	"table_2","text","tick","today","tool","unhide","unlock","unread-status","up",
	"up-arrow","up-line","upload-lg","web","website",
]

# Lucide icons used by Frappe core (sidebar, toolbar, views).
# These live in frappe/public/icons/lucide/icons.svg as <symbol id="icon-{name}">.
LUCIDE_ICONS = [
	"bell","bell-off","bell-ring","chevron-down","chevrons-up-down","circle-check",
	"clipboard","copy","corner-down-left","ellipsis","equal","equal-approximately",
	"expand","external-link","eye","eye-off","folder-open","funnel","keyboard","list",
	"minimize-2","reply","reply-all","scan-barcode","search","settings","shrink",
	"trash","users","x","arrow-down","arrow-right","arrow-up","check",
]

# Aliases: map semantically equivalent icon names across icon sets.
# When a user overrides one name, the engine also overrides its aliases.
ICON_ALIASES = {
	"bell": ["notification", "notifications", "es-line-notifications", "es-solid-notification"],
	"notification": ["bell"],
	"notifications": ["bell"],
	"search": ["es-line-search", "es-solid-search"],
}


def _strip_prefix(name):
	"""Strip es-line-, es-solid-, es-small-, icon- prefix to get the short name."""
	import re
	return re.sub(r"^es-(line|solid|small)-", "", re.sub(r"^icon-", "", name))


def get_short_icon_catalogue():
	"""Return icon catalogue with short names and their source full names.

	Each entry: {"short": "search", "full": "es-line-search", "set": "espresso_line"}
	Grouped by set so the picker can show which set each icon belongs to.
	"""
	result = []
	for full_name in ESPRESSO_LINE_ICONS:
		result.append({"short": _strip_prefix(full_name), "full": full_name, "set": "espresso_line"})
	for full_name in ESPRESSO_SOLID_ICONS:
		result.append({"short": _strip_prefix(full_name), "full": full_name, "set": "espresso_solid"})
	for full_name in TIMELESS_ICONS:
		result.append({"short": _strip_prefix(full_name), "full": full_name, "set": "timeless"})
	for full_name in LUCIDE_ICONS:
		result.append({"short": full_name, "full": full_name, "set": "lucide"})
	return result


def get_icon_aliases():
	"""Return the alias map so JS can build cross-references."""
	return ICON_ALIASES
