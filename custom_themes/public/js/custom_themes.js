(function () {
	"use strict";

	/* ═══════════════════════════════════════════════════════════════
	   Custom Themes — Frappe v16 theme engine (JS layer)  v2.1
	   SAFE-ONLY: colours, fonts, icon replacements.
	   No layout, z-index, position, overflow, or transform changes.
	   ═══════════════════════════════════════════════════════════════ */
	/* v2.2 — short-name icon mapping fix */

	var DEFAULTS = {
		enabled: 1,
		apply_to_desk: 1,
		apply_to_website: 1,
		// Main Theme preset
		main_theme: "",
		// Theme Colors
		enable_theme_colors: 0,
		primary_color: "#7C3AED",
		secondary_color: "#06B6D4",
		accent_color: "#F59E0B",
		icon_color: "#7C3AED",
		// Navbar & Sidebar
		enable_navbar_sidebar: 0,
		navbar_bg_color: "",
		navbar_text_color: "",
		sidebar_bg_color: "",
		sidebar_text_color: "",
		sidebar_active_bg_color: "",
		// Typography
		enable_typography: 0,
		font_family: "Poppins",
		heading_font: "Poppins",
		google_font_url:
			"https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
		font_size_base: "14px",
		text_color: "#1E293B",
		heading_color: "",
		link_color: "",
		text_muted_color: "",
		// Layout & Surfaces
		enable_layout: 0,
		background_color: "#F8FAFC",
		card_bg_color: "",
		control_bg_color: "",
		border_color: "",
		border_radius: "Medium",
		card_shadow: "Subtle",
		// Buttons
		enable_buttons: 0,
		btn_primary_text_color: "#FFFFFF",
		btn_primary_hover_color: "",
		// Status Colors
		enable_status_colors: 0,
		success_color: "#30A66D",
		danger_color: "#E03636",
		warning_color: "#E86C13",
		info_color: "#0289F7",
		// Branding & Login
		enable_branding: 0,
		custom_logo: "",
		custom_favicon: "",
		login_bg_color: "",
		login_bg_image: "",
		// Icon Overrides
		enable_icon_overrides: 0,
		icon_size_multiplier: 1,
		icon_overrides: [],
		// Dialogs & Popups
		enable_dialogs: 0,
		modal_header_bg: "",
		modal_header_text: "",
		modal_backdrop_blur: 0,
		modal_animation: "Fade",
		// Header & Footer
		enable_header_footer: 0,
		header_bg_color: "",
		header_text_color: "",
		header_border_color: "",
		sticky_header: 0,
		footer_bg_color: "",
		footer_text_color: "",
		footer_link_color: "",
		announcement_text: "",
		announcement_bg_color: "#7C3AED",
		announcement_text_color: "#FFFFFF",
		footer_custom_html: "",
		// Animations
		enable_animations: 0,
		animation_speed: "Normal",
		page_transition: "Fade",
		hover_lift_cards: 1,
		button_press_effect: 1,
		// List View
		enable_listview: 0,
		list_hover_bg: "",
		list_header_bg: "",
		list_striped: 0,
		// Form View
		enable_formview: 0,
		form_section_bg: "",
		form_section_text: "",
		// Scrollbar
		enable_scrollbar: 0,
		scrollbar_thumb: "",
		scrollbar_track: "",
		// Tables
		enable_tables: 0,
		table_header_bg: "",
		table_striped: 0,
		// Desk Layout & Icon Overrides
		enable_desk_layout: 0,
		desk_columns: "",
		desk_icon_size: "",
		desk_icon_gap: "",
		desk_icon_radius: "",
		desk_icon_overrides: [],
		// Dark Mode
		dark_mode_overrides: 0,
		dark_bg_color: "",
		dark_card_bg_color: "",
		dark_text_color: "",
		dark_primary_color: "",
		dark_navbar_bg_color: "",
		// Advanced
		custom_css: "",
	};

	// Section enable-flag → body class. CSS is scoped behind these.
	var SECTION_CLASSES = {
		enable_theme_colors: "ct-colors",
		enable_navbar_sidebar: "ct-navside",
		enable_typography: "ct-typo",
		enable_layout: "ct-layout",
		enable_buttons: "ct-buttons",
		enable_status_colors: "ct-status",
		enable_branding: "ct-brand",
		enable_icon_overrides: "ct-icons",
		enable_dialogs: "ct-dialogs",
		enable_header_footer: "ct-headfoot",
		enable_animations: "ct-anim",
		enable_listview: "ct-listview",
		enable_formview: "ct-formview",
		enable_scrollbar: "ct-scrollbar",
		enable_tables: "ct-tables",
		enable_desk_layout: "ct-desk",
		dark_mode_overrides: "ct-dark-override",
	};

	// ── Helpers ───────────────────────────────────────────────────

	function is_on(v) {
		return v === 1 || v === true || v === "1";
	}

	function has_val(v) {
		return v !== undefined && v !== null && v !== "";
	}

	function get_settings() {
		var src = null;
		if (window.__ct_preview_settings) {
			src = window.__ct_preview_settings;
		} else if (typeof frappe !== "undefined" && frappe.boot && frappe.boot.custom_theme_settings) {
			src = frappe.boot.custom_theme_settings;
		} else if (window.__custom_theme_settings) {
			src = window.__custom_theme_settings;
		}
		if (!src) return Object.assign({}, DEFAULTS);

		var merged = Object.assign({}, DEFAULTS);
		for (var k in DEFAULTS) {
			if (src.hasOwnProperty(k) && src[k] !== null && src[k] !== undefined && src[k] !== "") {
				merged[k] = src[k];
			}
		}
		if (src.icon_overrides) merged.icon_overrides = src.icon_overrides;
		if (src.desk_icon_overrides) merged.desk_icon_overrides = src.desk_icon_overrides;
		return merged;
	}

	function is_desk() {
		var p = window.location.pathname;
		return p.startsWith("/desk") || p.startsWith("/app");
	}

	function set_var(root, name, value) {
		if (has_val(value)) root.style.setProperty(name, String(value));
		else root.style.removeProperty(name);
	}

	function toggle_class(el, cls, condition) {
		if (!el) return;
		if (condition) el.classList.add(cls);
		else el.classList.remove(cls);
	}

	function escape_html(str) {
		return String(str == null ? "" : str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	// ── Font loading ─────────────────────────────────────────────

	function load_google_font(url) {
		if (!url) return;
		var link = document.getElementById("custom-themes-font");
		if (!link) {
			link = document.createElement("link");
			link.id = "custom-themes-font";
			link.rel = "stylesheet";
			document.head.appendChild(link);
		}
		if (link.href !== url) link.href = url;
	}

	function remove_google_font() {
		var link = document.getElementById("custom-themes-font");
		if (link) link.remove();
	}

	// ── Custom CSS injection ─────────────────────────────────────

	function inject_custom_css(css) {
		var el = document.getElementById("custom-themes-extra-css");
		if (!el) {
			el = document.createElement("style");
			el.id = "custom-themes-extra-css";
			document.head.appendChild(el);
		}
		el.textContent = css || "";
	}

	// ── Favicon ──────────────────────────────────────────────────

	var _original_favicon = null;

	function set_favicon(url) {
		var link =
			document.querySelector('link[rel="icon"]') ||
			document.querySelector('link[rel="shortcut icon"]');
		if (!url) {
			if (link && _original_favicon) link.href = _original_favicon;
			return;
		}
		if (link) {
			if (_original_favicon === null) _original_favicon = link.href;
			link.href = url;
		} else {
			link = document.createElement("link");
			link.rel = "icon";
			link.href = url;
			document.head.appendChild(link);
		}
	}

	// ── Navbar logo (with retry — navbar may render late) ────────

	function set_navbar_logo(url, attempt) {
		attempt = attempt || 0;
		var img = document.querySelector(".navbar-home img.app-logo, .navbar-home img");
		if (!img) {
			if (attempt < 10) {
				setTimeout(function () { set_navbar_logo(url, attempt + 1); }, 300);
			}
			return;
		}
		if (url) {
			if (!img.dataset.ctOriginalSrc) img.dataset.ctOriginalSrc = img.src;
			img.src = url;
			img.style.height = "32px";
			img.style.width = "auto";
		} else if (img.dataset.ctOriginalSrc) {
			img.src = img.dataset.ctOriginalSrc;
			img.style.height = "";
			img.style.width = "";
		}
	}

	// ── Announcement bar ─────────────────────────────────────────

	function inject_announcement(text) {
		var el = document.getElementById("ct-announcement-bar");
		if (!el) {
			el = document.createElement("div");
			el.id = "ct-announcement-bar";
			el.className = "ct-announcement-bar";
			var close_btn = document.createElement("button");
			close_btn.className = "ct-announce-close";
			close_btn.innerHTML = "&times;";
			close_btn.onclick = function () { el.style.display = "none"; };
			el.appendChild(document.createElement("span"));
			el.appendChild(close_btn);
			var navbar = document.querySelector(".navbar");
			if (navbar && navbar.parentNode) {
				navbar.parentNode.insertBefore(el, navbar);
			} else {
				document.body.prepend(el);
			}
		}
		el.querySelector("span").textContent = text;
		el.style.display = "";
	}

	function remove_announcement() {
		var el = document.getElementById("ct-announcement-bar");
		if (el) el.remove();
	}

	// ── Custom footer HTML ───────────────────────────────────────

	function inject_footer_html(html) {
		var el = document.getElementById("ct-custom-footer");
		if (!el) {
			el = document.createElement("div");
			el.id = "ct-custom-footer";
			el.className = "ct-custom-footer";
			var footer = document.querySelector("footer, .web-footer");
			if (footer) {
				footer.parentNode.insertBefore(el, footer);
			} else {
				document.body.appendChild(el);
			}
		}
		el.innerHTML = html;
	}

	function remove_footer_html() {
		var el = document.getElementById("ct-custom-footer");
		if (el) el.remove();
	}

	// ══════════════════════════════════════════════════════════════
	//  Icon replacement system
	// ══════════════════════════════════════════════════════════════

	var _icon_override_map = {};
	var _icon_observer = null;
	var _icon_scan_timer = null;
	var _icon_patch_installed = false;

	var ICON_SIZE_PX = { xs: 12, sm: 16, md: 20, lg: 24, xl: 40 };

	function build_icon_override_map(overrides, aliases) {
		_icon_override_map = {};
		if (!overrides || !overrides.length) {
			return;
		}
		// aliases: { "bell": ["notification","notifications",...], ... }
		var alias_map = aliases || {};

		overrides.forEach(function (o) {
			var name = (o.icon_name || "").trim();
			var url = (o.custom_icon || "").trim();
			var is_enabled = o.enabled === 1 || o.enabled === true || o.enabled === "1" || o.enabled === undefined;
			if (!name || !url || !is_enabled) return;

			// Derive short name (strip any prefix)
			var short_name = name
				.replace(/^es-(line|solid|small)-/, "")
				.replace(/^icon-/, "");

			// Map every possible name variant so both frappe.utils.icon()
			// calls (short names) and DOM <use href> lookups (full names)
			// find the override.
			_icon_override_map[name] = url;
			_icon_override_map[short_name] = url;
			_icon_override_map["es-line-" + short_name] = url;
			_icon_override_map["es-solid-" + short_name] = url;
			_icon_override_map["es-small-" + short_name] = url;

			// Also map all aliases of this icon name
			var alias_names = alias_map[short_name] || [];
			alias_names.forEach(function (alias) {
				var alias_short = alias
					.replace(/^es-(line|solid|small)-/, "")
					.replace(/^icon-/, "");
				_icon_override_map[alias] = url;
				_icon_override_map[alias_short] = url;
				_icon_override_map["es-line-" + alias_short] = url;
				_icon_override_map["es-solid-" + alias_short] = url;
			});
		});
	}

	function install_icon_patch(attempt) {
		attempt = attempt || 0;
		if (_icon_patch_installed) return;
		if (typeof frappe === "undefined" || !frappe.utils || !frappe.utils.icon) {
			if (attempt < 20) {
				setTimeout(function () { install_icon_patch(attempt + 1); }, 250);
			}
			return;
		}

		var original = frappe.utils.icon.bind(frappe.utils);
		frappe.utils.icon = function (
			icon_name, size, icon_class, icon_style, svg_class, current_color, stroke_color
		) {
			if (!icon_name) return "";
			if (frappe.utils.is_emoji && frappe.utils.is_emoji(icon_name)) {
				return original(icon_name, size, icon_class, icon_style, svg_class, current_color, stroke_color);
			}
			if (_icon_override_map[icon_name]) {
				return build_img_icon(_icon_override_map[icon_name], icon_name, size, icon_class, icon_style, svg_class);
			}
			return original(icon_name, size, icon_class, icon_style, svg_class, current_color, stroke_color);
		};
		_icon_patch_installed = true;
	}

	function build_img_icon(file_url, icon_name, size, icon_class, icon_style, svg_class) {
		var px;
		var size_class = "";
		var style_str = icon_style || "";

		if (typeof size === "object" && size) {
			style_str += ";width:" + size.width + ";height:" + size.height + ";";
			px = parseInt(size.width) || 20;
		} else {
			size = size || "sm";
			px = ICON_SIZE_PX[size] || 16;
			size_class = "icon-" + size;
		}

		return (
			'<img class="ct-icon-img ' + size_class + " " + (svg_class || "") + " " + (icon_class || "") + '" ' +
			'src="' + escape_html(file_url) + '" ' +
			'width="' + px + '" height="' + px + '" ' +
			'alt="" data-ct-icon="' + escape_html(icon_name) + '" ' +
			'style="' + escape_html(style_str) + '" ' +
			'aria-hidden="true" draggable="false">'
		);
	}

	function get_icon_name_from_use(use_el) {
		var href =
			use_el.getAttribute("href") ||
			use_el.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
			"";
		if (!href || href.indexOf("#") === -1) return null;
		var raw = href.split("#")[1] || "";
		if (raw.indexOf("es-line-") === 0 || raw.indexOf("es-solid-") === 0 || raw.indexOf("es-small-") === 0) {
			return raw;
		}
		if (raw.indexOf("icon-") === 0) return raw.substring(5);
		return raw;
	}

	function replace_icon_element(svg_el) {
		if (!svg_el || svg_el.tagName === "IMG") return;
		var use_el = svg_el.querySelector("use");
		if (!use_el) return;
		var icon_name = get_icon_name_from_use(use_el);
		if (!icon_name || !_icon_override_map[icon_name]) return;

		replace_icon_element_with_url(svg_el, _icon_override_map[icon_name], icon_name);
	}

	function replace_icon_element_with_url(svg_el, override_url, label) {
		if (!svg_el || svg_el.tagName === "IMG" || !svg_el.parentNode) return;

		var size = "sm";
		["xs", "sm", "md", "lg", "xl"].forEach(function (sz) {
			if (svg_el.classList.contains("icon-" + sz)) size = sz;
		});

		var temp = document.createElement("div");
		temp.innerHTML = build_img_icon(override_url, label, size, "", "", "");
		var img_el = temp.firstChild;
		if (!img_el) return;

		svg_el.classList.forEach(function (cls) {
			if (cls !== "icon" && cls !== "es-icon" && cls.indexOf("icon-") !== 0 &&
				cls.indexOf("es-line") !== 0 && cls.indexOf("es-solid") !== 0) {
				img_el.classList.add(cls);
			}
		});

		img_el.dataset.ctOriginal = svg_el.outerHTML;
		svg_el.parentNode.replaceChild(img_el, svg_el);
	}

	function scan_and_replace_icons() {
		if (!Object.keys(_icon_override_map).length) return;
		// 1. SVG sprite icons (existing logic)
		var icons = document.querySelectorAll("svg.icon, svg.es-icon");
		icons.forEach(function (el) {
			replace_icon_element(el);
		});

		// 2. Desk app icons (<img class="app-icon"> inside .desktop-icon)
		// Match by data-id (app name) against the override map.
		// User enters the app name (e.g. "Framework") as icon_name in child table.
		var desk_icons = document.querySelectorAll(".desktop-icon");
		desk_icons.forEach(function (link) {
			var app_id = (link.getAttribute("data-id") || "").trim();
			if (!app_id) return;

			var override_url = _icon_override_map[app_id] || _icon_override_map[app_id.toLowerCase()];
			if (!override_url) return;

			var app_img = link.querySelector("img.app-icon");
			if (!app_img) return;

			if (app_img.dataset.ctDeskOriginal && app_img.src.indexOf(override_url) !== -1) return;

			if (!app_img.dataset.ctDeskOriginal) {
				app_img.dataset.ctDeskOriginal = app_img.getAttribute("src");
			}
			app_img.setAttribute("src", override_url);
			app_img.classList.add("ct-desk-replaced");
		});

		// 3. Sidebar items — match by title OR item-name OR item-icon
		// e.g. title="DocType", item-name="DocType", item-icon="database"
		// User can enter any of these values as icon_name in the child table.
		var sidebar_items = document.querySelectorAll(".sidebar-item-container");
		sidebar_items.forEach(function (container) {
			var title = (container.getAttribute("title") || "").trim();
			var item_name = (container.getAttribute("item-name") || "").trim();
			var icon_span = container.querySelector("[item-icon]");
			var item_icon = icon_span ? (icon_span.getAttribute("item-icon") || "").trim() : "";

			// Check all three identifiers against the override map
			var override_url =
				(title && (_icon_override_map[title] || _icon_override_map[title.toLowerCase()])) ||
				(item_name && (_icon_override_map[item_name] || _icon_override_map[item_name.toLowerCase()])) ||
				(item_icon && (_icon_override_map[item_icon] || _icon_override_map[item_icon.toLowerCase()]));

			if (!override_url) return;

			// Find the SVG icon inside this sidebar item
			var svg_el = container.querySelector("svg.icon, svg.es-icon");
			if (!svg_el) return;
			// Skip if already replaced
			if (svg_el.tagName === "IMG") return;

			replace_icon_element_with_url(svg_el, override_url, title || item_name || item_icon);
		});

		// Restore desk icons that no longer have an override
		document.querySelectorAll("img.ct-desk-replaced").forEach(function (img) {
			var link = img.closest(".desktop-icon");
			if (!link) return;
			var app_id = (link.getAttribute("data-id") || "").trim();
			var has_override = _icon_override_map[app_id] || _icon_override_map[app_id.toLowerCase()];
			if (!has_override && img.dataset.ctDeskOriginal) {
				img.setAttribute("src", img.dataset.ctDeskOriginal);
				delete img.dataset.ctDeskOriginal;
				img.classList.remove("ct-desk-replaced");
			}
		});
	}

	function restore_original_icons() {
		document.querySelectorAll("img.ct-icon-img").forEach(function (img) {
			if (img.dataset.ctOriginal) {
				var temp = document.createElement("div");
				temp.innerHTML = img.dataset.ctOriginal;
				var svg = temp.firstChild;
				if (svg && img.parentNode) img.parentNode.replaceChild(svg, img);
			} else if (img.parentNode) {
				img.remove();
			}
		});
		// Restore desk app icons
		document.querySelectorAll("img.ct-desk-replaced").forEach(function (img) {
			if (img.dataset.ctDeskOriginal) {
				img.setAttribute("src", img.dataset.ctDeskOriginal);
				delete img.dataset.ctDeskOriginal;
				img.classList.remove("ct-desk-replaced");
			}
		});
	}

	function restore_stale_icons() {
		document.querySelectorAll("img.ct-icon-img").forEach(function (img) {
			var name = img.dataset.ctIcon;
			if (name && !_icon_override_map[name] && img.dataset.ctOriginal) {
				var temp = document.createElement("div");
				temp.innerHTML = img.dataset.ctOriginal;
				var svg = temp.firstChild;
				if (svg && img.parentNode) img.parentNode.replaceChild(svg, img);
			}
		});
	}

	// ── Desk-specific icon overrides (separate from sidebar icon system) ──

	function apply_desk_icon_overrides(overrides) {
		if (!overrides || !overrides.length) { restore_desk_overrides(); return; }

		// Build map: app_name → custom_icon url
		var desk_map = {};
		overrides.forEach(function (o) {
			var name = (o.app_name || "").trim();
			var url = (o.custom_icon || "").trim();
			var enabled = o.enabled === 1 || o.enabled === true || o.enabled === "1" || o.enabled === undefined;
			if (name && url && enabled) {
				desk_map[name] = url;
				desk_map[name.toLowerCase()] = url;
			}
		});

		function do_replace() {
			var desk_icons = document.querySelectorAll(".desktop-icon");
			desk_icons.forEach(function (link) {
				var app_id = (link.getAttribute("data-id") || "").trim();
				if (!app_id) return;

				var override_url = desk_map[app_id] || desk_map[app_id.toLowerCase()];
				var app_img = link.querySelector("img.app-icon");
				if (!app_img) return;

				if (override_url) {
					if (app_img.dataset.ctDeskOvOriginal && app_img.src.indexOf(override_url) !== -1) return;
					if (!app_img.dataset.ctDeskOvOriginal) {
						app_img.dataset.ctDeskOvOriginal = app_img.getAttribute("src");
					}
					app_img.setAttribute("src", override_url);
					app_img.classList.add("ct-desk-ov-replaced");
				} else if (app_img.classList.contains("ct-desk-ov-replaced") && app_img.dataset.ctDeskOvOriginal) {
					app_img.setAttribute("src", app_img.dataset.ctDeskOvOriginal);
					delete app_img.dataset.ctDeskOvOriginal;
					app_img.classList.remove("ct-desk-ov-replaced");
				}
			});
		}

		do_replace();
		setTimeout(do_replace, 500);
		setTimeout(do_replace, 1500);
	}

	function restore_desk_overrides() {
		document.querySelectorAll("img.ct-desk-ov-replaced").forEach(function (img) {
			if (img.dataset.ctDeskOvOriginal) {
				img.setAttribute("src", img.dataset.ctDeskOvOriginal);
				delete img.dataset.ctDeskOvOriginal;
			}
			img.classList.remove("ct-desk-ov-replaced");
		});
	}

	/* ══════════════════════════════════════════════════════════════
	   Desk Two-Sidebar System
	   Column 1: primary icon strip (from existing .icons-container)
	   Column 2: .ct-desk-sub-sidebar (child items of selected folder)
	   Column 3: .ct-desk-main-panel (welcome / content)
	   ══════════════════════════════════════════════════════════════ */

	var _ct_desk_folder_handler_installed = false;

	function inject_desk_welcome_panel() {
		var desk_container = document.querySelector(".desktop-container");
		if (!desk_container) return;

		// Inject main content panel if missing
		if (!desk_container.querySelector(".ct-desk-main-panel")) {
			var user_full = (typeof frappe !== "undefined" && frappe.session)
				? (frappe.session.user_fullname || frappe.session.user || "User")
				: "User";
			var first_name = user_full.split(" ")[0];
			var hour = new Date().getHours();
			var greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

			// Recent items
			var recent_html = "";
			try {
				var recent_routes = (frappe.boot.user && frappe.boot.user.recent) || [];
				var raw = typeof recent_routes === "string" ? JSON.parse(recent_routes) : recent_routes;
				var parsed = [];
				if (Array.isArray(raw)) {
					for (var i = 0; i < Math.min(raw.length, 8); i++) {
						var item = raw[i];
						if (Array.isArray(item) && item.length >= 2) {
							parsed.push({ doctype: item[0], name: item[1] });
						}
					}
				}
				if (parsed.length) {
					recent_html = '<div class="ct-desk-recent"><h3>Recent Items</h3><ul>';
					parsed.forEach(function (r) {
						var href = "/app/" + frappe.router.slug(r.doctype) + "/" + encodeURIComponent(r.name);
						recent_html += '<li><a href="' + href + '">'
							+ '<span class="ct-desk-recent-type">' + frappe.utils.escape_html(r.doctype) + '</span>'
							+ '<span class="ct-desk-recent-name">' + frappe.utils.escape_html(r.name) + '</span>'
							+ '</a></li>';
					});
					recent_html += '</ul></div>';
				}
			} catch (e) { /* ignore */ }

			// Shortcuts
			var shortcuts_html = '<div class="ct-desk-shortcuts"><h3>Quick Actions</h3><div class="ct-desk-shortcut-grid">'
				+ '<div class="ct-desk-shortcut-card" onclick="frappe.new_doc()"><span class="ct-desk-shortcut-icon">\u{1F4C4}</span><span class="ct-desk-shortcut-label">New Document</span></div>'
				+ '<div class="ct-desk-shortcut-card" onclick="frappe.searchdialog &amp;&amp; frappe.searchdialog.show()"><span class="ct-desk-shortcut-icon">\u{1F50D}</span><span class="ct-desk-shortcut-label">Search</span></div>'
				+ '<div class="ct-desk-shortcut-card" onclick="frappe.set_route(\'Form\', \'Custom Theme Settings\')"><span class="ct-desk-shortcut-icon">⚙️</span><span class="ct-desk-shortcut-label">Settings</span></div>'
				+ '</div></div>';

			var panel = document.createElement("div");
			panel.className = "ct-desk-main-panel";
			panel.innerHTML = '<div class="ct-desk-welcome">'
				+ '<h2>' + greeting + ', ' + frappe.utils.escape_html(first_name) + '!</h2>'
				+ '<p>Welcome to your workspace</p></div>'
				+ shortcuts_html + recent_html;
			desk_container.appendChild(panel);
		}

		// Install folder-click interceptor (once)
		if (!_ct_desk_folder_handler_installed) {
			_ct_desk_folder_handler_installed = true;
			install_folder_click_handler();
		}
	}

	function remove_desk_welcome_panel() {
		var panel = document.querySelector(".ct-desk-main-panel");
		if (panel) panel.remove();
		var sub = document.querySelector(".ct-desk-sub-sidebar");
		if (sub) sub.remove();
		// Remove active highlight
		document.querySelectorAll(".desktop-icon.ct-desk-active").forEach(function (el) {
			el.classList.remove("ct-desk-active");
		});
		_ct_desk_folder_handler_installed = false;
	}

	/* Build the list of child icons for a given parent label */
	/* ── Build child-icon list for a parent label ── */
	function get_child_icons_for(parent_label) {
		if (typeof frappe === "undefined" || !frappe.boot || !frappe.boot.desktop_icons) return [];
		var children = [];
		frappe.boot.desktop_icons.forEach(function (icon) {
			if (icon.parent_icon === parent_label && !icon.hidden) {
				children.push(icon);
			}
		});
		children.sort(function (a, b) {
			if (a.idx === b.idx) return (a.label || "").localeCompare(b.label || "");
			return (a.idx || 0) - (b.idx || 0);
		});
		return children;
	}

	/*
	 * Resolve the real route for a desktop icon.
	 * This mirrors Frappe's own get_route() from desktop.js exactly:
	 *   1. External links → use icon.link directly
	 *   2. Workspace Sidebar type → look up workspace_sidebar_item by label,
	 *      find the first Link item, then call frappe.utils.generate_route()
	 *   3. Fallback → read the href already set by Frappe on the DOM element
	 */
	function get_icon_route(icon) {
		if (!icon) return "";

		// 1. External links
		if (icon.link_type === "External" && icon.link) {
			if (icon.link.indexOf("http") === 0) return icon.link;
			return window.location.origin + icon.link;
		}

		// 2. Workspace Sidebar — the standard Frappe path
		var sidebar_map = (frappe.boot && frappe.boot.workspace_sidebar_item) || {};
		var sidebar = sidebar_map[icon.label.toLowerCase()];
		if (icon.link_type === "Workspace Sidebar" && sidebar) {
			var first_link = null;
			var items = sidebar.items || [];
			for (var i = 0; i < items.length; i++) {
				if (items[i].type === "Link") { first_link = items[i]; break; }
			}
			if (first_link) {
				try {
					if (first_link.link_type === "Report" && first_link.link_to) {
						var args = { type: "Report", name: first_link.link_to };
						if (first_link.report) {
							args.is_query_report =
								first_link.report.report_type === "Query Report" ||
								first_link.report.report_type === "Script Report";
							args.report_ref_doctype = first_link.report.ref_doctype;
						}
						return frappe.utils.generate_route(args);
					} else if (first_link.link_type === "Workspace") {
						var ws_slug = frappe.router.slug(first_link.link_to);
						var ws = frappe.workspaces && frappe.workspaces[ws_slug];
						if (ws) {
							return frappe.utils.generate_route({
								type: "workspace",
								name: ws.title,
								"public": ws["public"] ? 1 : 0,
								route_options: { sidebar: icon.label },
							});
						}
					} else if (first_link.link_type === "URL" && first_link.url) {
						return first_link.url;
					} else if (first_link.link_type === "Page" && first_link.route_options) {
						return frappe.utils.generate_route({
							type: first_link.link_type,
							name: first_link.link_to,
							route_options: JSON.parse(first_link.route_options),
						});
					} else {
						return frappe.utils.generate_route({
							type: first_link.link_type,
							name: first_link.link_to,
							tab: first_link.tab,
							route_options: { sidebar: icon.label },
						});
					}
				} catch (ex) { /* fall through to fallbacks */ }
			}
		}

		// 3. Read the href that Frappe's DesktopIcon already put on the DOM <a>
		var dom_icon = document.querySelector(
			'.desktop-container > .icons-container .desktop-icon[data-id="' + icon.label + '"]'
		);
		if (!dom_icon) {
			// Also check inside sub-sidebar's source (the modal icons, or any)
			dom_icon = document.querySelector('.desktop-icon[data-id="' + icon.label + '"]');
		}
		if (dom_icon) {
			var href = dom_icon.getAttribute("href");
			if (href && href !== "#" && href !== "javascript:void(0)") return href;
		}

		// 4. Last resort — try common patterns
		if (icon.link && icon.link_type === "DocType") {
			return "/app/" + frappe.router.slug(icon.link);
		}
		if (icon.link && icon.link_type === "Page") {
			return "/app/" + icon.link.toLowerCase().replace(/ /g, "-");
		}
		if (icon.link && icon.link_type === "Report") {
			return "/app/query-report/" + encodeURIComponent(icon.link);
		}

		// 5. Generate from the workspace sidebar lookup by label
		//    (for child icons whose parent was already resolved)
		var child_sidebar = sidebar_map[(icon.label || "").toLowerCase()];
		if (child_sidebar && child_sidebar.items) {
			for (var j = 0; j < child_sidebar.items.length; j++) {
				if (child_sidebar.items[j].type === "Link") {
					try {
						return frappe.utils.generate_route({
							type: child_sidebar.items[j].link_type,
							name: child_sidebar.items[j].link_to,
							route_options: { sidebar: icon.label },
						});
					} catch (ex2) { /* continue */ }
				}
			}
		}

		return "";
	}

	/* ── Show child icons in the second sidebar ── */
	function show_sub_sidebar(parent_label, children) {
		var desk_container = document.querySelector(".desktop-container");
		if (!desk_container) return;

		// Remove existing sub-sidebar
		var existing = desk_container.querySelector(".ct-desk-sub-sidebar");
		if (existing) existing.remove();

		if (!children || !children.length) return;

		var sub = document.createElement("div");
		sub.className = "ct-desk-sub-sidebar";

		var header_html = '<div class="ct-desk-sub-sidebar-header"><h3>'
			+ frappe.utils.escape_html(parent_label) + '</h3></div>';

		var list_html = '<ul class="ct-desk-sub-sidebar-list">';
		children.forEach(function (child) {
			var route = get_icon_route(child);

			// Icon image
			var img_src = "";
			if (typeof frappe.utils.get_desktop_icon === "function") {
				img_src = frappe.utils.get_desktop_icon(child.label, frappe.boot.desktop_icon_style) || "";
			}
			if (!img_src) {
				img_src = child.logo_url || child.icon_image || "";
			}

			var icon_html;
			if (img_src) {
				icon_html = '<div class="ct-sub-icon"><img src="' + frappe.utils.escape_html(img_src)
					+ '" alt="' + frappe.utils.escape_html(child.label) + '"></div>';
			} else {
				var bg = child.bg_color || "#94a3b8";
				var letter = (child.label || "?")[0].toUpperCase();
				icon_html = '<div class="ct-sub-icon" style="background:' + bg + ';color:#fff;font-weight:600;font-size:14px;">'
					+ letter + '</div>';
			}

			// If route is empty, make a click handler that uses frappe.set_route
			if (route) {
				list_html += '<li><a href="' + frappe.utils.escape_html(route) + '">'
					+ icon_html
					+ '<span class="ct-sub-label">' + frappe.utils.escape_html(child.label) + '</span>'
					+ '</a></li>';
			} else {
				// Use data-attribute and a click handler as fallback
				list_html += '<li><a href="#" class="ct-sub-no-route" data-label="'
					+ frappe.utils.escape_html(child.label) + '">'
					+ icon_html
					+ '<span class="ct-sub-label">' + frappe.utils.escape_html(child.label) + '</span>'
					+ '</a></li>';
			}
		});
		list_html += '</ul>';

		sub.innerHTML = header_html + list_html;

		// Fallback click handler for items without resolved routes
		sub.querySelectorAll(".ct-sub-no-route").forEach(function (a) {
			a.addEventListener("click", function (ev) {
				ev.preventDefault();
				var label = a.getAttribute("data-label");
				// Try to find the DOM icon and simulate its click (which Frappe already set up)
				var dom_icon = document.querySelector(
					'.desktop-icon[data-id="' + label + '"]'
				);
				if (dom_icon && dom_icon.getAttribute("href")) {
					window.location.href = dom_icon.getAttribute("href");
				} else {
					// Last resort: try standard workspace route
					frappe.set_route("app", frappe.router.slug(label));
				}
			});
		});

		// Insert after .icons-container but before .ct-desk-main-panel
		var main_panel = desk_container.querySelector(".ct-desk-main-panel");
		if (main_panel) {
			desk_container.insertBefore(sub, main_panel);
		} else {
			desk_container.appendChild(sub);
		}
	}

	/* ── Intercept folder/app icon clicks → second sidebar instead of modal ── */
	function install_folder_click_handler() {
		var desk_container = document.querySelector(".desktop-container");
		if (!desk_container) return;

		var icons_container = desk_container.querySelector(":scope > .icons-container");
		if (!icons_container) return;

		// Capturing listener fires BEFORE Frappe's own click handler
		icons_container.addEventListener("click", function (e) {
			if (!document.body.classList.contains("ct-desk")) return;

			var icon_el = e.target.closest(".desktop-icon");
			if (!icon_el) return;

			var app_id = (icon_el.getAttribute("data-id") || "").trim();
			if (!app_id) return;

			// Find the icon data object from frappe.boot.desktop_icons
			var icon_data = null;
			if (frappe.boot && frappe.boot.desktop_icons) {
				for (var i = 0; i < frappe.boot.desktop_icons.length; i++) {
					if (frappe.boot.desktop_icons[i].label === app_id) {
						icon_data = frappe.boot.desktop_icons[i];
						break;
					}
				}
			}
			if (!icon_data) return;

			// Check if this icon has children (folder/app with sub-items)
			var children = get_child_icons_for(app_id);

			if (children.length === 0) {
				// ── Not a folder: handle navigation ourselves ──
				// We intercept because Frappe might show the "not configured" alert
				// if label doesn't match workspace_sidebar_item key.
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				// Hide the sub-sidebar
				var existing_sub = desk_container.querySelector(".ct-desk-sub-sidebar");
				if (existing_sub) existing_sub.remove();
				icons_container.querySelectorAll(".desktop-icon.ct-desk-active").forEach(function (el) {
					el.classList.remove("ct-desk-active");
				});

				// Resolve the route properly
				var route = get_icon_route(icon_data);
				if (route) {
					// Use frappe.set_route for internal routes, window.open for external
					if (route.indexOf("http") === 0 && route.indexOf(window.location.origin) !== 0) {
						window.open(route, "_blank");
					} else {
						window.location.href = route;
					}
				} else {
					// Absolute last resort: try the workspace route by label slug
					frappe.set_route("app", frappe.router.slug(app_id));
				}
				return;
			}

			// ── Folder: prevent modal, show sub-sidebar ──
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();

			// Close any modal Frappe might have opened
			if (frappe.desktop_utils && frappe.desktop_utils.modal) {
				frappe.desktop_utils.close_desktop_modal();
			}
			try { $(".desktop-modal").modal("hide"); } catch (ex) { /* ignore */ }

			// Highlight active icon
			icons_container.querySelectorAll(".desktop-icon.ct-desk-active").forEach(function (el) {
				el.classList.remove("ct-desk-active");
			});
			icon_el.classList.add("ct-desk-active");

			show_sub_sidebar(app_id, children);

		}, true);
	}

	function schedule_icon_scan() {
		if (_icon_scan_timer) clearTimeout(_icon_scan_timer);
		_icon_scan_timer = setTimeout(scan_and_replace_icons, 50);
	}

	function start_icon_observer() {
		if (_icon_observer || !Object.keys(_icon_override_map).length) return;
		if (!document.body) return;

		_icon_observer = new MutationObserver(function (mutations) {
			for (var i = 0; i < mutations.length; i++) {
				var added = mutations[i].addedNodes;
				for (var j = 0; j < added.length; j++) {
					var node = added[j];
					if (node.nodeType !== 1) continue;
					if (
						(node.matches && node.matches("svg.icon, svg.es-icon")) ||
						(node.querySelector && node.querySelector("svg.icon, svg.es-icon"))
					) {
						schedule_icon_scan();
						return;
					}
				}
			}
		});
		_icon_observer.observe(document.body, { childList: true, subtree: true });
	}

	function stop_icon_observer() {
		if (_icon_observer) {
			_icon_observer.disconnect();
			_icon_observer = null;
		}
		if (_icon_scan_timer) {
			clearTimeout(_icon_scan_timer);
			_icon_scan_timer = null;
		}
	}

	// ══════════════════════════════════════════════════════════════
	//  Remove theme (full cleanup)
	// ══════════════════════════════════════════════════════════════

	var ALL_CT_VARS = [
		"--ct-primary", "--ct-secondary", "--ct-accent", "--ct-icon-color",
		"--ct-navbar-bg", "--ct-navbar-text", "--ct-sidebar-bg", "--ct-sidebar-text",
		"--ct-sidebar-active-bg", "--ct-font-family", "--ct-heading-font",
		"--ct-font-size-base", "--ct-text-color", "--ct-heading-color",
		"--ct-link-color", "--ct-text-muted-color",
		"--ct-bg-color", "--ct-card-bg", "--ct-control-bg", "--ct-border-color",
		"--ct-border-radius", "--ct-card-shadow",
		"--ct-btn-text", "--ct-btn-hover", "--ct-success-color", "--ct-danger-color",
		"--ct-warning-color", "--ct-info-color", "--ct-custom-logo", "--ct-login-bg",
		"--ct-icon-scale",
		"--ct-modal-header-bg", "--ct-modal-header-text",
		"--ct-header-bg", "--ct-header-text", "--ct-header-border",
		"--ct-footer-bg", "--ct-footer-text", "--ct-footer-link",
		"--ct-announce-bg", "--ct-announce-text",
		"--ct-anim-speed",
		"--ct-list-hover-bg", "--ct-list-header-bg",
		"--ct-form-section-bg", "--ct-form-section-text",
		"--ct-scrollbar-thumb", "--ct-scrollbar-track",
		"--ct-table-header-bg",
		"--ct-desk-columns", "--ct-desk-icon-size", "--ct-desk-gap", "--ct-desk-radius",
		"--ct-dark-bg", "--ct-dark-card-bg", "--ct-dark-text", "--ct-dark-primary",
		"--ct-dark-navbar-bg",
	];

	function remove_theme() {
		var root = document.documentElement;
		ALL_CT_VARS.forEach(function (p) { root.style.removeProperty(p); });

		[document.documentElement, document.body].forEach(function (el) {
			if (!el) return;
			el.classList.remove("custom-themes-active");
			Array.from(el.classList)
				.filter(function (c) { return c.indexOf("ct-") === 0; })
				.forEach(function (c) { el.classList.remove(c); });
		});

		remove_google_font();
		inject_custom_css("");
		set_favicon("");
		set_navbar_logo("");
		remove_announcement();
		remove_footer_html();
		_icon_override_map = {};
		stop_icon_observer();
		restore_original_icons();
		restore_desk_overrides();
		remove_desk_welcome_panel();
	}

	// ══════════════════════════════════════════════════════════════
	//  Apply theme — main entry point
	// ══════════════════════════════════════════════════════════════

	function apply_theme() {
		var s = get_settings();
		var root = document.documentElement;
		var body = document.body;
		if (!body) {
			document.addEventListener("DOMContentLoaded", apply_theme);
			return;
		}

		if (!is_on(s.enabled)) { remove_theme(); return; }
		if (is_desk() && !is_on(s.apply_to_desk)) { remove_theme(); return; }
		if (!is_desk() && !is_on(s.apply_to_website)) { remove_theme(); return; }

		body.classList.add("custom-themes-active");

		// ── Section body classes (CSS scoping) ──
		Object.keys(SECTION_CLASSES).forEach(function (flag) {
			toggle_class(body, SECTION_CLASSES[flag], is_on(s[flag]));
		});

		// ── Theme Colors ──
		if (is_on(s.enable_theme_colors)) {
			set_var(root, "--ct-primary", s.primary_color);
			set_var(root, "--ct-secondary", s.secondary_color);
			set_var(root, "--ct-accent", s.accent_color);
			set_var(root, "--ct-icon-color", s.icon_color);
		} else {
			["--ct-primary", "--ct-secondary", "--ct-accent", "--ct-icon-color"]
				.forEach(function (p) { root.style.removeProperty(p); });
		}

		// ── Navbar & Sidebar ──
		toggle_class(body, "ct-has-navbar-bg", is_on(s.enable_navbar_sidebar) && has_val(s.navbar_bg_color));
		toggle_class(body, "ct-has-navbar-text", is_on(s.enable_navbar_sidebar) && has_val(s.navbar_text_color));
		toggle_class(body, "ct-has-sidebar-bg", is_on(s.enable_navbar_sidebar) && has_val(s.sidebar_bg_color));
		toggle_class(body, "ct-has-sidebar-text", is_on(s.enable_navbar_sidebar) && has_val(s.sidebar_text_color));
		if (is_on(s.enable_navbar_sidebar)) {
			set_var(root, "--ct-navbar-bg", s.navbar_bg_color);
			set_var(root, "--ct-navbar-text", s.navbar_text_color);
			set_var(root, "--ct-sidebar-bg", s.sidebar_bg_color);
			set_var(root, "--ct-sidebar-text", s.sidebar_text_color);
			set_var(root, "--ct-sidebar-active-bg", s.sidebar_active_bg_color);
		}

		// ── Typography ──
		toggle_class(body, "ct-has-heading-color", is_on(s.enable_typography) && has_val(s.heading_color));
		toggle_class(body, "ct-has-text-muted", is_on(s.enable_typography) && has_val(s.text_muted_color));
		if (is_on(s.enable_typography)) {
			set_var(root, "--ct-font-family", "'" + s.font_family + "', sans-serif");
			set_var(root, "--ct-heading-font", "'" + (s.heading_font || s.font_family) + "', sans-serif");
			set_var(root, "--ct-font-size-base", s.font_size_base || "14px");
			set_var(root, "--ct-text-color", s.text_color);
			set_var(root, "--ct-heading-color", s.heading_color);
			set_var(root, "--ct-text-muted-color", s.text_muted_color);
			set_var(root, "--ct-link-color", s.link_color);
			load_google_font(s.google_font_url);
		} else {
			["--ct-font-family", "--ct-heading-font", "--ct-font-size-base",
				"--ct-text-color", "--ct-heading-color", "--ct-text-muted-color",
				"--ct-link-color"].forEach(function (p) { root.style.removeProperty(p); });
			remove_google_font();
		}

		// ── Layout & Surfaces ──
		if (is_on(s.enable_layout)) {
			set_var(root, "--ct-bg-color", s.background_color);
			set_var(root, "--ct-card-bg", s.card_bg_color);
			set_var(root, "--ct-control-bg", s.control_bg_color);
			set_var(root, "--ct-border-color", s.border_color);
			var radius_map = { None: "0", Small: "4px", Medium: "8px", Large: "12px", Pill: "999px" };
			set_var(root, "--ct-border-radius", radius_map[s.border_radius] || "8px");
			var shadow_map = {
				None: "none",
				Subtle: "0 1px 3px rgba(0,0,0,0.08)",
				Medium: "0 2px 8px rgba(0,0,0,0.12)",
				Heavy: "0 4px 16px rgba(0,0,0,0.18)",
			};
			set_var(root, "--ct-card-shadow", shadow_map[s.card_shadow] || "0 1px 3px rgba(0,0,0,0.08)");
		} else {
			["--ct-bg-color", "--ct-card-bg", "--ct-control-bg", "--ct-border-color",
				"--ct-border-radius", "--ct-card-shadow"]
				.forEach(function (p) { root.style.removeProperty(p); });
		}

		// ── Buttons ──
		if (is_on(s.enable_buttons)) {
			set_var(root, "--ct-btn-text", s.btn_primary_text_color || "#fff");
			set_var(root, "--ct-btn-hover", s.btn_primary_hover_color);
		} else {
			["--ct-btn-text", "--ct-btn-hover"].forEach(function (p) { root.style.removeProperty(p); });
		}

		// ── Status Colors ──
		if (is_on(s.enable_status_colors)) {
			set_var(root, "--ct-success-color", s.success_color);
			set_var(root, "--ct-danger-color", s.danger_color);
			set_var(root, "--ct-warning-color", s.warning_color);
			set_var(root, "--ct-info-color", s.info_color);
		} else {
			["--ct-success-color", "--ct-danger-color", "--ct-warning-color", "--ct-info-color"]
				.forEach(function (p) { root.style.removeProperty(p); });
		}

		// ── Branding & Login ──
		toggle_class(body, "ct-has-custom-logo", is_on(s.enable_branding) && has_val(s.custom_logo));
		toggle_class(body, "ct-has-login-bg", is_on(s.enable_branding) && has_val(s.login_bg_color));
		if (is_on(s.enable_branding)) {
			if (has_val(s.custom_logo)) {
				set_var(root, "--ct-custom-logo", "url('" + s.custom_logo + "')");
				set_navbar_logo(s.custom_logo);
			} else {
				root.style.removeProperty("--ct-custom-logo");
				set_navbar_logo("");
			}
			set_favicon(s.custom_favicon);
			set_var(root, "--ct-login-bg", s.login_bg_color);
		} else {
			["--ct-custom-logo", "--ct-login-bg"]
				.forEach(function (p) { root.style.removeProperty(p); });
			set_favicon("");
			set_navbar_logo("");
		}

		// ── Icon Overrides ──
		if (is_on(s.enable_icon_overrides)) {
			var scale = parseFloat(s.icon_size_multiplier) || 1;
			toggle_class(body, "ct-icon-scaled", scale !== 1);
			set_var(root, "--ct-icon-scale", String(scale));

			build_icon_override_map(s.icon_overrides, s.icon_aliases);
			restore_stale_icons();
			scan_and_replace_icons();
			start_icon_observer();
			setTimeout(scan_and_replace_icons, 300);
			setTimeout(scan_and_replace_icons, 1000);
			setTimeout(scan_and_replace_icons, 3000);
		} else {
			body.classList.remove("ct-icon-scaled");
			root.style.removeProperty("--ct-icon-scale");
			_icon_override_map = {};
			stop_icon_observer();
			restore_original_icons();
		}

		// ── Dialogs & Popups ──
		if (is_on(s.enable_dialogs)) {
			set_var(root, "--ct-modal-header-bg", s.modal_header_bg);
			set_var(root, "--ct-modal-header-text", s.modal_header_text);
			toggle_class(body, "ct-backdrop-blur", is_on(s.modal_backdrop_blur));
			toggle_class(body, "ct-modal-anim-zoom", s.modal_animation === "Zoom");
			toggle_class(body, "ct-modal-anim-slide-up", s.modal_animation === "Slide Up");
			toggle_class(body, "ct-modal-anim-slide-down", s.modal_animation === "Slide Down");
		} else {
			["--ct-modal-header-bg", "--ct-modal-header-text"]
				.forEach(function (p) { root.style.removeProperty(p); });
			body.classList.remove("ct-backdrop-blur", "ct-modal-anim-zoom",
				"ct-modal-anim-slide-up", "ct-modal-anim-slide-down");
		}

		// ── Header & Footer ──
		if (is_on(s.enable_header_footer)) {
			set_var(root, "--ct-header-bg", s.header_bg_color);
			set_var(root, "--ct-header-text", s.header_text_color);
			set_var(root, "--ct-header-border", s.header_border_color);
			set_var(root, "--ct-footer-bg", s.footer_bg_color);
			set_var(root, "--ct-footer-text", s.footer_text_color);
			set_var(root, "--ct-footer-link", s.footer_link_color);
			toggle_class(body, "ct-sticky-header", is_on(s.sticky_header));
			// Announcement bar
			if (has_val(s.announcement_text)) {
				set_var(root, "--ct-announce-bg", s.announcement_bg_color);
				set_var(root, "--ct-announce-text", s.announcement_text_color);
				inject_announcement(s.announcement_text);
			} else {
				remove_announcement();
			}
			// Custom footer HTML
			if (has_val(s.footer_custom_html)) {
				inject_footer_html(s.footer_custom_html);
			} else {
				remove_footer_html();
			}
		} else {
			["--ct-header-bg", "--ct-header-text", "--ct-header-border",
				"--ct-footer-bg", "--ct-footer-text", "--ct-footer-link",
				"--ct-announce-bg", "--ct-announce-text"]
				.forEach(function (p) { root.style.removeProperty(p); });
			body.classList.remove("ct-sticky-header");
			remove_announcement();
			remove_footer_html();
		}

		// ── Animations ──
		if (is_on(s.enable_animations)) {
			var speed_map = { Fast: "100ms", Normal: "200ms", Slow: "400ms" };
			set_var(root, "--ct-anim-speed", speed_map[s.animation_speed] || "200ms");
			toggle_class(body, "ct-hover-lift", is_on(s.hover_lift_cards));
			toggle_class(body, "ct-btn-press", is_on(s.button_press_effect));
			toggle_class(body, "ct-page-fade", s.page_transition === "Fade");
			toggle_class(body, "ct-page-slide-up", s.page_transition === "Slide Up");
		} else {
			root.style.removeProperty("--ct-anim-speed");
			body.classList.remove("ct-hover-lift", "ct-btn-press", "ct-page-fade", "ct-page-slide-up");
		}

		// ── List View ──
		if (is_on(s.enable_listview)) {
			set_var(root, "--ct-list-hover-bg", s.list_hover_bg);
			set_var(root, "--ct-list-header-bg", s.list_header_bg);
			toggle_class(body, "ct-list-striped", is_on(s.list_striped));
		} else {
			["--ct-list-hover-bg", "--ct-list-header-bg"]
				.forEach(function (p) { root.style.removeProperty(p); });
			body.classList.remove("ct-list-striped");
		}

		// ── Form View ──
		if (is_on(s.enable_formview)) {
			set_var(root, "--ct-form-section-bg", s.form_section_bg);
			set_var(root, "--ct-form-section-text", s.form_section_text);
		} else {
			["--ct-form-section-bg", "--ct-form-section-text"]
				.forEach(function (p) { root.style.removeProperty(p); });
		}

		// ── Scrollbar ──
		if (is_on(s.enable_scrollbar)) {
			set_var(root, "--ct-scrollbar-thumb", s.scrollbar_thumb);
			set_var(root, "--ct-scrollbar-track", s.scrollbar_track);
		} else {
			["--ct-scrollbar-thumb", "--ct-scrollbar-track"]
				.forEach(function (p) { root.style.removeProperty(p); });
		}

		// ── Tables ──
		if (is_on(s.enable_tables)) {
			set_var(root, "--ct-table-header-bg", s.table_header_bg);
			toggle_class(body, "ct-table-striped", is_on(s.table_striped));
		} else {
			root.style.removeProperty("--ct-table-header-bg");
			body.classList.remove("ct-table-striped");
		}

		// ── Desk Layout & Icon Overrides ──
		if (is_on(s.enable_desk_layout)) {
			// Grid columns
			var col_map = { "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8" };
			set_var(root, "--ct-desk-columns", col_map[s.desk_columns] || "");

			// Icon size
			var size_map = { Small: "40px", Medium: "56px", Large: "72px", "Extra Large": "88px" };
			set_var(root, "--ct-desk-icon-size", size_map[s.desk_icon_size] || "");

			// Gap
			var gap_map = { Compact: "8px", Normal: "16px", Relaxed: "24px", Spacious: "36px" };
			set_var(root, "--ct-desk-gap", gap_map[s.desk_icon_gap] || "");

			// Radius
			var rad_map = { None: "0", Small: "6px", Medium: "12px", Large: "20px", Circle: "50%" };
			set_var(root, "--ct-desk-radius", rad_map[s.desk_icon_radius] || "");

			// Desk-specific icon overrides (separate from sidebar icon_overrides)
			apply_desk_icon_overrides(s.desk_icon_overrides || []);

			// Inject the welcome panel into the desk main area
			inject_desk_welcome_panel();
		} else {
			["--ct-desk-columns", "--ct-desk-icon-size", "--ct-desk-gap", "--ct-desk-radius"]
				.forEach(function (p) { root.style.removeProperty(p); });
			restore_desk_overrides();
			remove_desk_welcome_panel();
		}

		// ── Dark Mode ──
		if (is_on(s.dark_mode_overrides)) {
			set_var(root, "--ct-dark-bg", s.dark_bg_color);
			set_var(root, "--ct-dark-card-bg", s.dark_card_bg_color);
			set_var(root, "--ct-dark-text", s.dark_text_color);
			set_var(root, "--ct-dark-primary", s.dark_primary_color);
			set_var(root, "--ct-dark-navbar-bg", s.dark_navbar_bg_color);
		} else {
			["--ct-dark-bg", "--ct-dark-card-bg", "--ct-dark-text",
				"--ct-dark-primary", "--ct-dark-navbar-bg"]
				.forEach(function (p) { root.style.removeProperty(p); });
		}

		// ── Custom CSS ──
		inject_custom_css(s.custom_css);
	}

	// ══════════════════════════════════════════════════════════════
	//  Fetch settings from API (website / portal / guest fallback)
	// ══════════════════════════════════════════════════════════════

	function fetch_and_apply() {
		fetch("/api/method/custom_themes.api.get_public_settings")
			.then(function (r) { return r.json(); })
			.then(function (data) {
				if (data && data.message) {
					window.__custom_theme_settings = data.message;
					if (typeof frappe !== "undefined" && frappe.boot) {
						frappe.boot.custom_theme_settings = data.message;
					}
				}
			})
			.catch(function () { /* fall back to defaults */ })
			.finally(function () { apply_theme(); });
	}

	// ══════════════════════════════════════════════════════════════
	//  Public API — used by the settings form for live preview
	// ══════════════════════════════════════════════════════════════

	window.custom_themes = {
		apply: apply_theme,
		remove: remove_theme,
		preview: function (settings) {
			window.__ct_preview_settings = settings;
			apply_theme();
		},
		end_preview: function () {
			window.__ct_preview_settings = null;
			apply_theme();
		},
		get_settings: get_settings,
	};

	// ══════════════════════════════════════════════════════════════
	//  Initialization
	// ══════════════════════════════════════════════════════════════

	function init() {
		install_icon_patch();

		if (typeof frappe !== "undefined" && frappe.boot && frappe.boot.custom_theme_settings) {
			apply_theme();
		} else if (typeof frappe !== "undefined" && typeof $ !== "undefined") {
			$(function () {
				setTimeout(function () {
					if (frappe.boot && frappe.boot.custom_theme_settings) apply_theme();
					else fetch_and_apply();
				}, 100);
			});
		} else if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", fetch_and_apply);
		} else {
			fetch_and_apply();
		}

		// Re-apply after desk SPA route changes
		if (typeof frappe !== "undefined" && typeof $ !== "undefined") {
			$(document).on("page-change", function () {
				setTimeout(apply_theme, 50);
			});
		}

		// Real-time updates when settings are saved
		if (typeof frappe !== "undefined" && frappe.realtime) {
			frappe.realtime.on("custom_theme_updated", function (data) {
				if (data && data.settings) {
					window.__ct_preview_settings = null;
					if (frappe.boot) frappe.boot.custom_theme_settings = data.settings;
					window.__custom_theme_settings = data.settings;
					restore_original_icons();
					apply_theme();
					if (frappe.show_alert) {
						frappe.show_alert({ message: __("Theme updated"), indicator: "green" });
					}
				}
			});
		}
	}

	init();
})();
