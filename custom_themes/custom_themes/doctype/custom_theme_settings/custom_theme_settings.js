/* Custom Theme Settings - form controller
   Features: live preview, searchable icon dropdown with SVG previews,
   icon browser dialog, presets, theme export/import, reset to defaults. */

// ══════════════════════════════════════════════════════════════════
//  Cached icon catalogue (fetched once, reused everywhere)
// ══════════════════════════════════════════════════════════════════

var _ct_catalogue = null;   // array of { short, full, set }
var _ct_icon_data = null;   // grouped { espresso_line, espresso_solid, timeless, catalogue }

function ensure_icon_catalogue(callback) {
	if (_ct_catalogue) { callback(_ct_catalogue, _ct_icon_data); return; }
	frappe.call({
		method: "custom_themes.api.get_icon_list",
		callback: function (r) {
			if (r && r.message) {
				_ct_icon_data = r.message;
				_ct_catalogue = r.message.catalogue || [];
				callback(_ct_catalogue, _ct_icon_data);
			}
		},
	});
}

function strip_icon_prefix(name) {
	return (name || "").replace(/^es-(line|solid|small)-/, "").replace(/^icon-/, "");
}

// ══════════════════════════════════════════════════════════════════
//  Main form events
// ══════════════════════════════════════════════════════════════════

// Track preview state so buttons don't duplicate
var _ct_previewing = false;

frappe.ui.form.on("Custom Theme Settings", {
	refresh(frm) {
		frm.set_intro(
			__("Pick a <b>Main Theme</b> for a full makeover, or tweak individual sections below. Use <b>Live Preview</b> to try changes, then <b>Save</b>.")
		);

		render_icon_previews(frm);
		ensure_icon_catalogue(function () {});

		// ── Live Preview ──
		frm.add_custom_button(__("Live Preview"), function () {
			if (!window.custom_themes) return;
			_ct_previewing = true;
			stop_preview_btn.show();
			window.custom_themes.preview(build_settings_from_form(frm));
			frm.page.set_indicator(__("Previewing"), "green");
			frappe.show_alert({ message: __("Preview active - Save to keep, or Stop to revert."), indicator: "green" });
		}).addClass("btn-primary");

		let stop_preview_btn = frm.add_custom_button(__("Stop Preview"), function () {
			if (!window.custom_themes) return;

			_ct_previewing = false;
			window.custom_themes.end_preview();

			frm.page.clear_indicator();

			frappe.show_alert({
				message: __("Preview stopped - reverted to saved settings."),
				indicator: "orange"
			});

			stop_preview_btn.hide();
		});

		// ── Stop Preview ──
		// frm.add_custom_button(__("Stop Preview"), function () {
		// 	if (!window.custom_themes) return;
		// 	_ct_previewing = false;
		// 	window.custom_themes.end_preview();
		// 	frm.page.clear_indicator();
		// 	frappe.show_alert({ message: __("Preview stopped - reverted to saved settings."), indicator: "orange" });
		// });

		// ── Save & Hard Reload ──
		frm.add_custom_button(__("Save & Reload"), function () {
			frm.save().then(function () {
				frappe.show_alert({ message: __("Saved. Reloading..."), indicator: "blue" });
				setTimeout(hardReload, 300);
			});
		});

		// Restore indicator if we were previewing before refresh
		if (_ct_previewing) {
			frm.page.set_indicator(__("Previewing"), "green");
		} else {
			stop_preview_btn.hide();
		}

		// ── Tools ──
		frm.add_custom_button(__("Browse Frappe Icons"), function () {
			show_icon_browser(frm);
		}, __("Tools"));

		frm.add_custom_button(__("Export Theme"), function () {
			export_theme(frm);
		}, __("Tools"));

		frm.add_custom_button(__("Import Theme"), function () {
			import_theme(frm);
		}, __("Tools"));

		frm.add_custom_button(__("Reset to Defaults"), function () {
			frappe.confirm(
				__("Reset all theme settings to factory defaults?"),
				function () {
					apply_values(frm, get_default_values());
					frm.set_value("main_theme", "");
					frm.clear_table("icon_overrides");
					frm.refresh_fields();
					frappe.show_alert({ message: __("Defaults restored - Save to apply."), indicator: "blue" });
				}
			);
		}, __("Tools"));
	},

	// ── Main Theme selector ──
	main_theme(frm) {
		var theme_name = frm.doc.main_theme;
		if (!theme_name) return;

		var themes = get_main_themes();
		var theme = themes[theme_name];
		if (!theme) return;

		// Reset to defaults first, then overlay the theme
		apply_values(frm, get_default_values());
		apply_values(frm, theme);
		frm.refresh_fields();

		// Instant preview
		if (window.custom_themes) {
			_ct_previewing = true;
			window.custom_themes.preview(build_settings_from_form(frm));
			frm.page.set_indicator(__("Previewing"), "green");
		}
		frappe.show_alert({
			message: __('{0} theme applied - Save to keep.', [theme_name]),
			indicator: "blue",
		});
	},

	after_save(frm) {
		_ct_previewing = false;
		if (window.custom_themes) {
			window.custom_themes.end_preview();
		}
		frm.page.clear_indicator();
	},
});

// Performs a hard reload by clearing caches and adding a cache-busting query param. ( Ctrl + Shift + R )
async function hardReload() {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }

  const url = new URL(window.location.href);
  url.searchParams.set('_reload', Date.now());

  window.location.replace(url.toString());
}

// ══════════════════════════════════════════════════════════════════
//  Child table events - searchable icon dropdown
// ══════════════════════════════════════════════════════════════════

frappe.ui.form.on("Custom Icon Override", {
	icon_name(frm) {
		render_icon_previews(frm);
	},
	icon_overrides_add(frm, cdt, cdn) {
		// When a new row is added, immediately open the icon picker
		render_icon_previews(frm);
		var grid_row = frm.fields_dict.icon_overrides.grid.grid_rows_by_docname[cdn];
		if (grid_row) {
			// Open inline editing and show picker
			grid_row.toggle_editable_row();
			setTimeout(function () {
				show_icon_picker_for_row(frm, cdt, cdn);
			}, 100);
		}
	},
	form_render(frm, cdt, cdn) {
		setup_icon_dropdown_for_row(frm, cdt, cdn);
	},
});

// ══════════════════════════════════════════════════════════════════
//  Icon dropdown - attaches to icon_name field in expanded row
// ══════════════════════════════════════════════════════════════════

function setup_icon_dropdown_for_row(frm, cdt, cdn) {
	var grid_row = frm.fields_dict.icon_overrides.grid.grid_rows_by_docname[cdn];
	if (!grid_row) return;

	var icon_name_field = grid_row.get_field("icon_name");
	if (!icon_name_field || !icon_name_field.$input) return;

	var $input = icon_name_field.$input;
	if ($input.data("ct-dropdown-attached")) return;
	$input.data("ct-dropdown-attached", true);

	// Allow typing (for app names like "Framework") and clicking (for picker)
	$input.css("cursor", "text");
	$input.attr("placeholder", __("Click picker or type app name..."));

	// Add a search icon indicator
	var $wrapper = $input.closest(".frappe-control");
	if (!$wrapper.find(".ct-pick-btn").length) {
		$wrapper.find(".control-input").css("position", "relative");
		var $btn = $('<button class="ct-pick-btn" type="button" title="' + __("Pick icon") + '">' +
			'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' +
			'<circle cx="7" cy="7" r="5"/><path d="M11 11L14 14" stroke-linecap="round"/>' +
			'</svg></button>');
		$wrapper.find(".control-input").append($btn);
	}

	// Picker button opens the dialog; clicking input allows typing
	$wrapper.find(".ct-pick-btn").on("click", function (e) {
		e.stopPropagation();
		show_icon_picker_for_row(frm, cdt, cdn);
	});
}

// ══════════════════════════════════════════════════════════════════
//  Icon Picker Dialog - searchable grid with icon + name
// ══════════════════════════════════════════════════════════════════

function show_icon_picker_for_row(frm, cdt, cdn) {
	ensure_icon_catalogue(function (catalogue) {
		var current_value = frappe.model.get_value(cdt, cdn, "icon_name") || "";
		var current_short = strip_icon_prefix(current_value);

		var SET_LABELS = {
			espresso_line: "Espresso Line",
			espresso_solid: "Espresso Solid",
			timeless: "Timeless",
			lucide: "Lucide",
		};

		var d = new frappe.ui.Dialog({
			title: __("Select Icon"),
			size: "large",
			fields: [
				{
					fieldname: "icon_set_filter",
					fieldtype: "Select",
					label: __("Icon Set"),
					options: "All\nEspresso Line\nEspresso Solid\nTimeless\nLucide",
					default: "All",
					change: function () { render_picker(); },
				},
				{
					fieldname: "search",
					fieldtype: "Data",
					label: __("Search Icons"),
					placeholder: __("Type to search... e.g. home, edit, bell, settings"),
					change: function () { render_picker(); },
				},
				{ fieldname: "icon_grid", fieldtype: "HTML" },
				{
					fieldname: "app_note",
					fieldtype: "HTML",
					options: '<div class="text-muted small mt-2" style="padding:8px 12px;background:var(--bg-light-gray);border-radius:6px;">' +
						'<strong>Tip:</strong> To replace a <b>Desk app icon</b> (e.g. Framework, HR Module), ' +
						'close this dialog and type the app name directly in the "Standard Icon" field. ' +
						'The name must match the <code>data-id</code> attribute exactly.</div>',
				},
			],
		});

		// Add "Enter Custom Name" button for desk app icons / custom entries
		d.set_primary_action(__("Enter Custom Name"), function () {
			var custom_name = d.get_value("search") || "";
			if (!custom_name.trim()) {
				frappe.show_alert({ message: __("Type a name in the search box first (e.g. Framework, HR Module)"), indicator: "orange" });
				return;
			}
			frappe.model.set_value(cdt, cdn, "icon_name", custom_name.trim());
			frm.refresh_field("icon_overrides");
			render_icon_previews(frm);
			d.hide();
			frappe.show_alert({ message: __("Set custom name: {0}", [custom_name.trim()]), indicator: "green" });
		});

		d.show();
		setTimeout(function () { d.fields_dict.search.$input.focus(); }, 200);
		d.fields_dict.search.$input.on("keyup", function () { render_picker(); });

		function get_filtered_icons() {
			var filter_set = d.get_value("icon_set_filter") || "All";
			var search = (d.get_value("search") || "").toLowerCase().trim();
			var filter_key = {
				"Espresso Line": "espresso_line",
				"Espresso Solid": "espresso_solid",
				"Timeless": "timeless",
				"Lucide": "lucide",
			}[filter_set];

			// console.log("catalogue", catalogue.length, catalogue)
			var items = catalogue.filter(function (item) {
				if (filter_key && item.set !== filter_key) return false;
				if (search && item.short.indexOf(search) === -1) return false;
				return true;
			});
			return items;
		}

		function render_picker() {
			var $wrap = d.fields_dict.icon_grid.$wrapper;
			var items = get_filtered_icons();

			if (!items.length) {
				$wrap.html('<div class="ct-picker-empty"><p class="text-muted">' +
					__("No icons match your search.") + "</p></div>");
				return;
			}

			// Existing overrides - use short names for comparison
			var existing = {};
			(frm.doc.icon_overrides || []).forEach(function (row) {
				if (row.icon_name) existing[strip_icon_prefix(row.icon_name)] = true;
			});

			var html = '<div class="ct-picker-grid">';

			items.forEach(function (item) {
				var svg_html = "";
				// Use FULL name for SVG preview (frappe.utils.icon needs it)
				try { svg_html = frappe.utils.icon(item.full, "md"); } catch (e) { svg_html = ""; }

				var display_name = item.short.replace(/-/g, " ");
				var set_label = SET_LABELS[item.set] || item.set;

				var is_current = item.short === current_short;
				var is_existing = existing[item.short] && !is_current;

				var cls = "ct-picker-item";
				if (is_current) cls += " ct-picker-selected";
				if (is_existing) cls += " ct-picker-used";

				html +=
					'<div class="' + cls + '" data-short="' + frappe.utils.escape_html(item.short) + '" ' +
					'title="' + frappe.utils.escape_html(item.short) + " (" + set_label + ')">' +
					'<div class="ct-picker-icon">' + (svg_html || '<span class="text-muted">?</span>') + "</div>" +
					'<div class="ct-picker-label">' + frappe.utils.escape_html(display_name) + "</div>" +
					'<div class="ct-picker-set">' + frappe.utils.escape_html(set_label) + "</div>" +
					"</div>";
			});

			html += "</div>";
			html += '<div class="ct-picker-footer text-muted">' +
				items.length + " " + __("icons") +
				" &middot; " + __("The short name is stored. All variants (line/solid) are replaced.") +
				"</div>";

			$wrap.html(html);

			$wrap.find(".ct-picker-item").on("click", function () {
				var short_name = $(this).data("short");

				// Check if short name already used in another row
				var used_in_other = (frm.doc.icon_overrides || []).find(function (row) {
					return strip_icon_prefix(row.icon_name) === short_name && row.name !== cdn;
				});
				if (used_in_other) {
					frappe.show_alert({
						message: __("{0} is already overridden in row {1}.", [short_name, used_in_other.idx]),
						indicator: "orange",
					});
					return;
				}

				// Store the SHORT name
				frappe.model.set_value(cdt, cdn, "icon_name", short_name);
				frm.refresh_field("icon_overrides");
				render_icon_previews(frm);
				d.hide();
				frappe.show_alert({
					message: __("Selected: {0}", [short_name]),
					indicator: "green",
				});
			});
		}

		render_picker();
	});
}

// ══════════════════════════════════════════════════════════════════
//  Icon previews inside the child table (list view)
// ══════════════════════════════════════════════════════════════════

function render_icon_previews(frm) {
	setTimeout(function () {
		var grid = frm.fields_dict.icon_overrides;
		if (!grid || !grid.grid || !grid.grid.grid_rows) return;

		grid.grid.grid_rows.forEach(function (row) {
			var icon_name = row.doc.icon_name;
			if (!icon_name) return;

			var $cell = row.columns.icon_name;
			if (!$cell || !$cell.$wrapper) return;

			var $static = $cell.$wrapper.find(".static-area");
			if (!$static.length) return;

			// icon_name is now a short name like "search".
			// Try rendering via frappe.utils.icon - it works for timeless
			// short names directly; for espresso we try es-line-{name}.
			var svg_html = "";
			try { svg_html = frappe.utils.icon(icon_name, "sm"); } catch (e) { /* no-op */ }
			if (!svg_html || svg_html.indexOf("<svg") === -1) {
				try { svg_html = frappe.utils.icon("es-line-" + icon_name, "sm"); } catch (e) { /* no-op */ }
			}

			var display_name = icon_name.replace(/-/g, " ");

			$static.html(
				'<span class="ct-preview-icon">' +
				(svg_html || "") +
				"<span>" + frappe.utils.escape_html(display_name) + "</span>" +
				"</span>"
			);
		});
	}, 200);
}

// ══════════════════════════════════════════════════════════════════
//  Build settings from (possibly unsaved) form
// ══════════════════════════════════════════════════════════════════

function build_settings_from_form(frm) {
	var settings = {};
	Object.keys(frm.doc).forEach(function (key) {
		if (key.indexOf("_") === 0 || ["doctype", "name", "owner", "modified", "modified_by", "creation", "docstatus", "idx"].includes(key)) return;
		settings[key] = frm.doc[key];
	});
	settings.icon_overrides = (frm.doc.icon_overrides || []).map(function (row) {
		return {
			icon_name: row.icon_name,
			custom_icon: row.custom_icon,
			enabled: row.enabled,
		};
	});
	return settings;
}

function apply_values(frm, values) {
	for (var key in values) frm.set_value(key, values[key]);
}

// ══════════════════════════════════════════════════════════════════
//  Defaults & presets
// ══════════════════════════════════════════════════════════════════

function get_default_values() {
	return {
		enabled: 1,
		apply_to_desk: 1,
		apply_to_website: 1,
		enable_theme_colors: 0,
		enable_navbar_sidebar: 0,
		enable_typography: 0,
		enable_layout: 0,
		enable_buttons: 0,
		enable_status_colors: 0,
		enable_branding: 0,
		enable_icon_overrides: 0,
		enable_dialogs: 0,
		enable_header_footer: 0,
		enable_animations: 0,
		enable_listview: 0,
		enable_formview: 0,
		enable_scrollbar: 0,
		enable_tables: 0,
		primary_color: "#7C3AED",
		secondary_color: "#06B6D4",
		accent_color: "#F59E0B",
		icon_color: "#7C3AED",
		navbar_bg_color: "",
		navbar_text_color: "",
		sidebar_bg_color: "",
		sidebar_text_color: "",
		sidebar_active_bg_color: "",
		font_family: "Poppins",
		heading_font: "Poppins",
		google_font_url:
			"https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
		font_size_base: "14px",
		text_color: "#1E293B",
		heading_color: "",
		link_color: "",
		text_muted_color: "",
		background_color: "#F8FAFC",
		card_bg_color: "",
		control_bg_color: "",
		border_color: "",
		border_radius: "Medium",
		card_shadow: "Subtle",
		btn_primary_text_color: "#FFFFFF",
		btn_primary_hover_color: "",
		success_color: "#30A66D",
		danger_color: "#E03636",
		warning_color: "#E86C13",
		info_color: "#0289F7",
		custom_logo: "",
		custom_favicon: "",
		login_bg_color: "",
		login_bg_image: "",
		icon_size_multiplier: 1,
		modal_header_bg: "",
		modal_header_text: "",
		modal_backdrop_blur: 0,
		modal_animation: "Fade",
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
		animation_speed: "Normal",
		page_transition: "Fade",
		hover_lift_cards: 1,
		button_press_effect: 1,
		list_hover_bg: "",
		list_header_bg: "",
		list_striped: 0,
		form_section_bg: "",
		form_section_text: "",
		scrollbar_thumb: "",
		scrollbar_track: "",
		table_header_bg: "",
		table_striped: 0,
		dark_mode_overrides: 0,
		dark_bg_color: "",
		dark_card_bg_color: "",
		dark_text_color: "",
		dark_primary_color: "",
		dark_navbar_bg_color: "",
		custom_css: "",
	};
}

// ══════════════════════════════════════════════════════════════════
//  Main Theme presets - full UI makeover (colors + navbar + buttons + fonts + layout)
// ══════════════════════════════════════════════════════════════════

function get_main_themes() {
	return {
		"Default (Frappe)": {
			// Resets to Frappe's default look
			enable_theme_colors: 0,
			enable_navbar_sidebar: 0,
			enable_typography: 0,
			enable_layout: 0,
			enable_buttons: 0,
			enable_status_colors: 0,
			enable_listview: 0,
			enable_formview: 0,
			enable_animations: 0,
		},

		"Ocean Blue": {
			// Clean blue & white - professional, airy
			enable_theme_colors: 1,
			enable_navbar_sidebar: 1,
			enable_typography: 1,
			enable_layout: 1,
			enable_buttons: 1,
			enable_status_colors: 1,
			enable_listview: 1,
			enable_formview: 1,
			enable_animations: 1,
			primary_color: "#2563EB",
			secondary_color: "#3B82F6",
			accent_color: "#F59E0B",
			icon_color: "#2563EB",
			navbar_bg_color: "#1E3A5F",
			navbar_text_color: "#E0F2FE",
			sidebar_bg_color: "#F0F7FF",
			sidebar_text_color: "#1E3A5F",
			sidebar_active_bg_color: "#DBEAFE",
			font_family: "Inter",
			heading_font: "Inter",
			google_font_url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
			text_color: "#1E293B",
			heading_color: "#0F172A",
			link_color: "#2563EB",
			background_color: "#F8FAFF",
			card_bg_color: "#FFFFFF",
			border_radius: "Medium",
			card_shadow: "Subtle",
			btn_primary_text_color: "#FFFFFF",
			btn_primary_hover_color: "#1D4ED8",
			success_color: "#16A34A",
			danger_color: "#DC2626",
			warning_color: "#EA580C",
			info_color: "#2563EB",
			list_hover_bg: "#EFF6FF",
			list_header_bg: "#F0F7FF",
			form_section_bg: "#F0F7FF",
			form_section_text: "#1E3A5F",
			hover_lift_cards: 1,
			button_press_effect: 1,
			animation_speed: "Normal",
		},

		"Crimson Gold": {
			// Regal red & gold - bold, luxurious
			enable_theme_colors: 1,
			enable_navbar_sidebar: 1,
			enable_typography: 1,
			enable_layout: 1,
			enable_buttons: 1,
			enable_status_colors: 1,
			enable_listview: 1,
			enable_formview: 1,
			enable_animations: 1,
			primary_color: "#B91C1C",
			secondary_color: "#DC2626",
			accent_color: "#D97706",
			icon_color: "#B91C1C",
			navbar_bg_color: "#450A0A",
			navbar_text_color: "#FEF2F2",
			sidebar_bg_color: "#FFF8F0",
			sidebar_text_color: "#78350F",
			sidebar_active_bg_color: "#FEF3C7",
			font_family: "Playfair Display",
			heading_font: "Playfair Display",
			google_font_url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Lato:wght@400;700&display=swap",
			text_color: "#292524",
			heading_color: "#450A0A",
			link_color: "#B91C1C",
			background_color: "#FFFBF5",
			card_bg_color: "#FFFFFF",
			border_radius: "Small",
			card_shadow: "Subtle",
			btn_primary_text_color: "#FFFFFF",
			btn_primary_hover_color: "#991B1B",
			success_color: "#15803D",
			danger_color: "#B91C1C",
			warning_color: "#B45309",
			info_color: "#1D4ED8",
			list_hover_bg: "#FEF3C7",
			list_header_bg: "#FFF8F0",
			form_section_bg: "#FEF3C7",
			form_section_text: "#78350F",
			hover_lift_cards: 1,
			button_press_effect: 1,
			animation_speed: "Normal",
		},

		"Midnight Dark": {
			// Dark theme - sleek, modern
			enable_theme_colors: 1,
			enable_navbar_sidebar: 1,
			enable_typography: 1,
			enable_layout: 1,
			enable_buttons: 1,
			enable_status_colors: 1,
			enable_listview: 1,
			enable_formview: 1,
			enable_animations: 1,
			dark_mode_overrides: 1,
			primary_color: "#818CF8",
			secondary_color: "#6366F1",
			accent_color: "#FBBF24",
			icon_color: "#A5B4FC",
			navbar_bg_color: "#0F0F23",
			navbar_text_color: "#E2E8F0",
			sidebar_bg_color: "#1A1A2E",
			sidebar_text_color: "#CBD5E1",
			sidebar_active_bg_color: "#312E81",
			font_family: "JetBrains Mono",
			heading_font: "Inter",
			google_font_url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
			text_color: "#E2E8F0",
			heading_color: "#F8FAFC",
			link_color: "#818CF8",
			background_color: "#0F172A",
			card_bg_color: "#1E293B",
			border_color: "#334155",
			border_radius: "Medium",
			card_shadow: "None",
			btn_primary_text_color: "#FFFFFF",
			btn_primary_hover_color: "#6366F1",
			success_color: "#34D399",
			danger_color: "#FB7185",
			warning_color: "#FBBF24",
			info_color: "#60A5FA",
			dark_bg_color: "#0F172A",
			dark_card_bg_color: "#1E293B",
			dark_text_color: "#E2E8F0",
			dark_primary_color: "#818CF8",
			dark_navbar_bg_color: "#0F0F23",
			list_hover_bg: "#334155",
			list_header_bg: "#1E293B",
			form_section_bg: "#1E293B",
			form_section_text: "#CBD5E1",
			hover_lift_cards: 0,
			button_press_effect: 1,
			animation_speed: "Fast",
		},

		"Forest Green": {
			// Nature-inspired - calm, earthy
			enable_theme_colors: 1,
			enable_navbar_sidebar: 1,
			enable_typography: 1,
			enable_layout: 1,
			enable_buttons: 1,
			enable_status_colors: 1,
			enable_listview: 1,
			enable_formview: 1,
			enable_animations: 1,
			primary_color: "#059669",
			secondary_color: "#0D9488",
			accent_color: "#D97706",
			icon_color: "#059669",
			navbar_bg_color: "#14532D",
			navbar_text_color: "#DCFCE7",
			sidebar_bg_color: "#F0FDF4",
			sidebar_text_color: "#14532D",
			sidebar_active_bg_color: "#D1FAE5",
			font_family: "Nunito",
			heading_font: "Nunito",
			google_font_url: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap",
			text_color: "#1C1917",
			heading_color: "#14532D",
			link_color: "#059669",
			background_color: "#F5FFF8",
			card_bg_color: "#FFFFFF",
			border_radius: "Large",
			card_shadow: "Subtle",
			btn_primary_text_color: "#FFFFFF",
			btn_primary_hover_color: "#047857",
			success_color: "#059669",
			danger_color: "#DC2626",
			warning_color: "#D97706",
			info_color: "#0284C7",
			list_hover_bg: "#D1FAE5",
			list_header_bg: "#F0FDF4",
			form_section_bg: "#ECFDF5",
			form_section_text: "#14532D",
			hover_lift_cards: 1,
			button_press_effect: 1,
			animation_speed: "Normal",
		},

		"Royal Purple": {
			// Elegant purple - creative, premium
			enable_theme_colors: 1,
			enable_navbar_sidebar: 1,
			enable_typography: 1,
			enable_layout: 1,
			enable_buttons: 1,
			enable_status_colors: 1,
			enable_listview: 1,
			enable_formview: 1,
			enable_animations: 1,
			primary_color: "#7C3AED",
			secondary_color: "#8B5CF6",
			accent_color: "#EC4899",
			icon_color: "#7C3AED",
			navbar_bg_color: "#2E1065",
			navbar_text_color: "#EDE9FE",
			sidebar_bg_color: "#FAF5FF",
			sidebar_text_color: "#581C87",
			sidebar_active_bg_color: "#E9D5FF",
			font_family: "DM Sans",
			heading_font: "DM Sans",
			google_font_url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
			text_color: "#1E1B4B",
			heading_color: "#2E1065",
			link_color: "#7C3AED",
			background_color: "#FAFAFF",
			card_bg_color: "#FFFFFF",
			border_radius: "Large",
			card_shadow: "Subtle",
			btn_primary_text_color: "#FFFFFF",
			btn_primary_hover_color: "#6D28D9",
			success_color: "#10B981",
			danger_color: "#EF4444",
			warning_color: "#F59E0B",
			info_color: "#6366F1",
			list_hover_bg: "#EDE9FE",
			list_header_bg: "#FAF5FF",
			form_section_bg: "#F5F3FF",
			form_section_text: "#581C87",
			hover_lift_cards: 1,
			button_press_effect: 1,
			animation_speed: "Normal",
		},

		"Sunset Orange": {
			// Warm sunset tones - energetic, friendly
			enable_theme_colors: 1,
			enable_navbar_sidebar: 1,
			enable_typography: 1,
			enable_layout: 1,
			enable_buttons: 1,
			enable_status_colors: 1,
			enable_listview: 1,
			enable_formview: 1,
			enable_animations: 1,
			primary_color: "#EA580C",
			secondary_color: "#F97316",
			accent_color: "#EAB308",
			icon_color: "#EA580C",
			navbar_bg_color: "#431407",
			navbar_text_color: "#FFF7ED",
			sidebar_bg_color: "#FFF7ED",
			sidebar_text_color: "#7C2D12",
			sidebar_active_bg_color: "#FED7AA",
			font_family: "Quicksand",
			heading_font: "Quicksand",
			google_font_url: "https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap",
			text_color: "#292524",
			heading_color: "#431407",
			link_color: "#EA580C",
			background_color: "#FFFCF5",
			card_bg_color: "#FFFFFF",
			border_radius: "Large",
			card_shadow: "Medium",
			btn_primary_text_color: "#FFFFFF",
			btn_primary_hover_color: "#C2410C",
			success_color: "#16A34A",
			danger_color: "#DC2626",
			warning_color: "#CA8A04",
			info_color: "#2563EB",
			list_hover_bg: "#FED7AA",
			list_header_bg: "#FFF7ED",
			form_section_bg: "#FFF7ED",
			form_section_text: "#7C2D12",
			hover_lift_cards: 1,
			button_press_effect: 1,
			animation_speed: "Normal",
		},

		"Teal Breeze": {
			// Cool teal/cyan - modern, refreshing
			enable_theme_colors: 1,
			enable_navbar_sidebar: 1,
			enable_typography: 1,
			enable_layout: 1,
			enable_buttons: 1,
			enable_status_colors: 1,
			enable_listview: 1,
			enable_formview: 1,
			enable_animations: 1,
			primary_color: "#0891B2",
			secondary_color: "#06B6D4",
			accent_color: "#8B5CF6",
			icon_color: "#0891B2",
			navbar_bg_color: "#134E4A",
			navbar_text_color: "#CCFBF1",
			sidebar_bg_color: "#F0FDFA",
			sidebar_text_color: "#134E4A",
			sidebar_active_bg_color: "#CCFBF1",
			font_family: "Rubik",
			heading_font: "Rubik",
			google_font_url: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap",
			text_color: "#1E293B",
			heading_color: "#134E4A",
			link_color: "#0891B2",
			background_color: "#F5FFFE",
			card_bg_color: "#FFFFFF",
			border_radius: "Medium",
			card_shadow: "Subtle",
			btn_primary_text_color: "#FFFFFF",
			btn_primary_hover_color: "#0E7490",
			success_color: "#059669",
			danger_color: "#E11D48",
			warning_color: "#D97706",
			info_color: "#0891B2",
			list_hover_bg: "#CCFBF1",
			list_header_bg: "#F0FDFA",
			form_section_bg: "#F0FDFA",
			form_section_text: "#134E4A",
			hover_lift_cards: 1,
			button_press_effect: 1,
			animation_speed: "Normal",
		},

		"Slate Minimal": {
			// Clean grayscale - professional, no-nonsense
			enable_theme_colors: 1,
			enable_navbar_sidebar: 1,
			enable_typography: 1,
			enable_layout: 1,
			enable_buttons: 1,
			enable_status_colors: 1,
			enable_listview: 1,
			enable_formview: 1,
			enable_animations: 1,
			primary_color: "#334155",
			secondary_color: "#475569",
			accent_color: "#2563EB",
			icon_color: "#475569",
			navbar_bg_color: "#0F172A",
			navbar_text_color: "#CBD5E1",
			sidebar_bg_color: "#F8FAFC",
			sidebar_text_color: "#334155",
			sidebar_active_bg_color: "#E2E8F0",
			font_family: "IBM Plex Sans",
			heading_font: "IBM Plex Sans",
			google_font_url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
			text_color: "#1E293B",
			heading_color: "#0F172A",
			link_color: "#334155",
			background_color: "#F1F5F9",
			card_bg_color: "#FFFFFF",
			border_radius: "Small",
			card_shadow: "Subtle",
			btn_primary_text_color: "#FFFFFF",
			btn_primary_hover_color: "#1E293B",
			success_color: "#16A34A",
			danger_color: "#DC2626",
			warning_color: "#D97706",
			info_color: "#2563EB",
			list_hover_bg: "#F1F5F9",
			list_header_bg: "#F8FAFC",
			form_section_bg: "#F1F5F9",
			form_section_text: "#334155",
			hover_lift_cards: 0,
			button_press_effect: 1,
			animation_speed: "Fast",
		},
	};
}

// ══════════════════════════════════════════════════════════════════
//  Theme export / import
// ══════════════════════════════════════════════════════════════════

function export_theme(frm) {
	var data = build_settings_from_form(frm);
	data.__custom_themes_export = 1;
	var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
	var a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = "custom-theme-" + frappe.datetime.now_date() + ".json";
	a.click();
	URL.revokeObjectURL(a.href);
	frappe.show_alert({ message: __("Theme exported."), indicator: "green" });
}

function import_theme(frm) {
	var input = document.createElement("input");
	input.type = "file";
	input.accept = "application/json";
	input.onchange = function () {
		var file = input.files[0];
		if (!file) return;
		var reader = new FileReader();
		reader.onload = function () {
			try {
				var data = JSON.parse(reader.result);
				if (!data.__custom_themes_export) {
					frappe.msgprint(__("Not a valid Custom Themes export file."));
					return;
				}
				delete data.__custom_themes_export;
				var icon_overrides = data.icon_overrides || [];
				delete data.icon_overrides;

				apply_values(frm, data);
				frm.clear_table("icon_overrides");
				icon_overrides.forEach(function (o) {
					var row = frm.add_child("icon_overrides");
					row.icon_name = o.icon_name;
					row.custom_icon = o.custom_icon;
					row.enabled = o.enabled;
				});
				frm.refresh_fields();
				frappe.show_alert({
					message: __("Theme imported - review and click Save to apply."),
					indicator: "blue",
				});
			} catch (e) {
				frappe.msgprint(__("Could not read file: ") + e.message);
			}
		};
		reader.readAsText(file);
	};
	input.click();
}

// ══════════════════════════════════════════════════════════════════
//  Icon Browser dialog (full catalog with upload)
// ══════════════════════════════════════════════════════════════════

function show_icon_browser(frm) {
	ensure_icon_catalogue(function (catalogue, icon_data) {
		var SET_LABELS = {
			espresso_line: "Espresso Line",
			espresso_solid: "Espresso Solid",
			timeless: "Timeless",
		};

		var d = new frappe.ui.Dialog({
			title: __("Frappe Icon Browser - click an icon to replace it"),
			size: "extra-large",
			fields: [
				{
					fieldname: "icon_set_filter",
					fieldtype: "Select",
					label: __("Icon Set"),
					options: "All\nEspresso Line\nEspresso Solid\nTimeless",
					default: "All",
					change: function () { render_icons(); },
				},
				{
					fieldname: "search",
					fieldtype: "Data",
					label: __("Search"),
					placeholder: __("Type to filter icons..."),
					change: function () { render_icons(); },
				},
				{ fieldname: "icon_grid", fieldtype: "HTML" },
			],
		});

		d.show();
		d.fields_dict.search.$input.on("keyup", function () { render_icons(); });

		function existing_short_map() {
			var map = {};
			(frm.doc.icon_overrides || []).forEach(function (row) {
				if (row.icon_name) map[strip_icon_prefix(row.icon_name)] = true;
			});
			return map;
		}

		function render_icons() {
			var $wrap = d.fields_dict.icon_grid.$wrapper;
			var filter_set = d.get_value("icon_set_filter") || "All";
			var search = (d.get_value("search") || "").toLowerCase();
			var filter_key = {
				"Espresso Line": "espresso_line",
				"Espresso Solid": "espresso_solid",
				"Timeless": "timeless",
				"Lucide": "lucide",
			}[filter_set];

			var items = catalogue.filter(function (item) {
				if (filter_key && item.set !== filter_key) return false;
				if (search && item.short.indexOf(search) === -1) return false;
				return true;
			});

			var existing = existing_short_map();
			var html = '<div class="ct-picker-grid ct-picker-grid-lg">';

			items.forEach(function (item) {
				var svg_html = "";
				try { svg_html = frappe.utils.icon(item.full, "md"); } catch (e) { svg_html = "?"; }

				var display_name = item.short.replace(/-/g, " ");
				var set_label = SET_LABELS[item.set] || item.set;
				var already = existing[item.short];
				var cls = "ct-picker-item";
				if (already) cls += " ct-picker-used";

				html +=
					'<div class="' + cls + '" data-short="' + frappe.utils.escape_html(item.short) + '" ' +
					'title="' + frappe.utils.escape_html(item.short) + " (" + set_label + ")" +
					(already ? " (already overridden)" : "") + '">' +
					'<div class="ct-picker-icon">' + svg_html + "</div>" +
					'<div class="ct-picker-label">' + frappe.utils.escape_html(display_name) + "</div>" +
					'<div class="ct-picker-set">' + frappe.utils.escape_html(set_label) + "</div>" +
					"</div>";
			});

			html += "</div>";
			html += '<div class="ct-picker-footer text-muted">' +
				items.length + " " + __("icons. Blue = already overridden. Click to upload replacement.") +
				"</div>";

			$wrap.html(html);

			$wrap.find(".ct-picker-item").on("click", function () {
				// Pass the SHORT name to the upload dialog
				open_upload_dialog(frm, $(this).data("short"), d, render_icons);
			});
		}

		render_icons();
	});
}

function open_upload_dialog(frm, icon_name, browser_dialog, rerender_fn) {
	// icon_name is now a short name - match existing rows by short name too
	var short_name = strip_icon_prefix(icon_name);
	var existing_row = (frm.doc.icon_overrides || []).find(function (r) {
		return strip_icon_prefix(r.icon_name) === short_name;
	});

	new frappe.ui.FileUploader({
		folder: "Home",
		restrictions: {
			allowed_file_types: [".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp"],
		},
		make_attachments_public: true,
		on_success: function (file_doc) {
			if (existing_row) {
				frappe.model.set_value(existing_row.doctype, existing_row.name, "custom_icon", file_doc.file_url);
				frappe.model.set_value(existing_row.doctype, existing_row.name, "enabled", 1);
			} else {
				var row = frm.add_child("icon_overrides");
				row.icon_name = short_name;  // store short name
				row.custom_icon = file_doc.file_url;
				row.enabled = 1;
			}
			frm.refresh_field("icon_overrides");
			frm.dirty();
			render_icon_previews(frm);
			if (rerender_fn) rerender_fn();
			frappe.show_alert({
				message: __("{0} replacement uploaded - click Save to apply.", [icon_name]),
				indicator: "green",
			});
		},
	});
}
