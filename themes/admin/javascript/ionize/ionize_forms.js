ION.append({

	hasUnsavedData: false,

	setUnsavedData:function()
	{
		ION.hasUnsavedData = true;
	},

	initSaveWarning:function(form)
	{
		ION.hasUnsavedData = false;
		var formInputs = $(form).getElements('input');
		formInputs.append($(form).getElements('textarea'));
		formInputs.addEvent('change', function(event)
		{
			ION.hasUnsavedData = true;
		});
	},

	cancelSaveWarning:function()
	{
		ION.hasUnsavedData = false;
	},

	/**
	 * Get the associated form object and send it directly
	 *
	 * @param	string		URL to send the form data
	 * @param	string		Element to update
	 * @param	string		Element update URL
	 */
	sendForm: function(url, form)
	{
		if (!form) {
			form = '';
		}
		else {
			form = $(form);
		}
		ION.updateRichTextEditors();

		new Request.JSON(ION.getJSONRequestOptions(url, form)).send();
	},

	/**
	 * Get the associated form object and send attached data directly
	 *
	 * @param	string		URL to send the form data
	 * @param	string		Element to update
	 * @param	string		Element update URL
	 */
	sendData: function(url, data)
	{
		ION.updateRichTextEditors();

		new Request.JSON(ION.getJSONRequestOptions(url, data)).send();
	},


	/**
	 * Set an XHR action to a form and add click event to the given element
	 *
	 * @param	string	form ID
	 * @param	string	element on wich attach the action (ID)
	 * @param	string	action URL (with or without the base URL prefix)
	 * @param	object	Confirmation object	{message: 'The confirmation question'}
	 *
	 */
	setFormSubmit: function(form, button, url, confirm, options)
	{
		if (typeOf($(form))!='null' && typeOf($(button)) != 'null')
		{
			// Form Validation
			var fv = new Form.Validator.Inline(form, {
				errorPrefix: '',
				showError: function(element) {
					element.show();
				}
			});

			// Warning if changed but not saved
			ION.initSaveWarning(form);

			// Stores the button in the form
			$(form).store('submit', $(button));

			// Add the form submit event with a confirmation window
			if ($(button) && (typeOf(confirm) == 'object'))
			{
				$(button).enabled = true;
				var func = function()
				{
					var requestOptions = ION.getJSONRequestOptions(url, $(form), options);
					var r = new Request.JSON(requestOptions);
					r.send();
				};

				// Form submit or button event
				$(button).removeEvents('click');
				$(button).addEvent('click', function(e)
				{
					if (typeOf(e) != 'null') e.stop();
					if (this.enabled)
					{
						this.enabled=false;
						$(button).addClass('disabled');
						(function(){
							this.enabled = true;
							this.removeClass('disabled');
						}).delay(4000, this);

						ION.confirmation('conf' + button.id, func, confirm.message);
					}
				});
			}
			// Add the form submit button event without confirmation
			else if ($(button))
			{
				// Form submit or button event
				$(button).enabled = true;
				$(button).removeEvents('click');
				$(button).addEvent('click', function(e)
				{
					if (typeOf(e) != 'null') e.stop();

					// Cancel the save warning (content changed)
					ION.cancelSaveWarning();

					// Disable the button for x seconds.
					if (this.enabled)
					{
						this.enabled=false;
						$(button).addClass('disabled');
						(function(){
							this.enabled = true;
							this.removeClass('disabled');
						}).delay(4000, this);

						var parent = $(form).getParent('.mocha');
						var result = fv.validate();

						if ( ! result)
						{
							if (parent)
							new ION.Notify(parent, {type:'error'}).show('ionize_message_form_validation_please_correct');
						}
						else
						{
							// tinyMCE and CKEditor trigerSave
							ION.updateRichTextEditors();

							// Get the form
							var requestOptions = ION.getJSONRequestOptions(url, $(form), options);
							var r = new Request.JSON(requestOptions);
							r.send();

							// Close the window
							if (typeOf(parent) != 'null')
								parent.close();
						}
					}
				});
			}
		}
		else
		{
			console.log('ION.setFormSubmit() error : The form "' + form + '" or the button "' + button + '" do not exist.');
		}
	},

	setChangeSubmit: function(form, button, url, confirm)
	{
		// Add the form submit event with a confirmation window
		if ($(button) && (typeOf(confirm) == 'object'))
		{
			var func = function()
			{
				var options = ION.getJSONRequestOptions(url, $(form));

				var r = new Request.JSON(options);
				r.send();
			};
		
			// Form submit or button event
			$(button).removeEvents('change');
			$(button).addEvent('change', function(e)
			{
				e.stop();
				ION.confirmation('conf' + button.id, func, confirm.message);
			});
		}
		// Add the form submit button event without confirmation
		else if ($(button))
		{
			// Form submit or button event
			$(button).removeEvents('change');
			$(button).addEvent('change', function(e)
			{
				e.stop();
				
				// tinyMCE and CKEditor trigerSave
				ION.updateRichTextEditors();
				
				// Get the form
				var options = ION.getJSONRequestOptions(url, $(form));

				var r = new Request.JSON(options);
				r.send();
			});
		}
	},


	/**
	 * CTRL+s or Meta+s save event
	 *
	 */
	addFormSaveEvent: function(button)
	{
		if ($(button))
		{
			// Remove all existing Ctrl+S Save Event
			$(document).removeEvents('keydown');
			
			// Add new keydown 
			$(document).addEvent('keydown', function(event)
			{
				if((event.control || event.meta) && event.key == 's')
				{
					event.stop();
					if ($(button))
					{
						$(button).fireEvent('click', event);
					}
				}
			});
		}
	},

	updateRichTextEditors: function()
	{
		if (typeof tinyMCE != "undefined")
		{
			(tinyMCE.editors).each(function(tiny)
			{
				tiny.save();
			});
		}

		if (typeof CKEDITOR != "undefined")
		{
			for (instance in CKEDITOR.instances)
				CKEDITOR.instances[instance].updateElement();
		}
	},
	
	
	/**
	 * Cleans all the inputs (input + textarea) from a givve form
	 *
	 */
	clearFormInput: function(args)
	{
		// Inputs and textareas : .inputtext
		$$('#' + args.form + ' .inputtext').each(function(item, idx)
		{
			item.setProperty('value', '');
			item.set('text', '');
		});
		
		// Checkboxes : .inputcheckbox
		$$('#' + args.form + ' .inputcheckbox').each(function(item, idx)
		{
			item.removeProperty('checked');
		});
	},

	getFormFieldContainer: function(options)
	{
		var cl = options.class ? ' ' + options.class : '';
		var label = options.label ? options.label : '';

		var dl = new Element('dl', {
			'class':'small' + cl
		});
		var dt = new Element('dt', {
			'class':''
		}).inject(dl);

		new Element('label', {text: label}).inject(dt);

		var dd = new Element('dd', {
			'class':''
		}).inject(dl);

		return dl;
		/*
		 <!-- Ordering : First or last (or Element one if exists ) -->
		 <?php if( empty($id_item)) :?>
		 <dl class="small mb10">
		 <dt>
		 <label for="ordering"><?php echo lang('ionize_label_ordering'); ?></label>
		 </dt>
		 <dd>
		 <select name="ordering" id="ordering<?php echo $id_item; ?>" class="select">
		 <?php if( ! empty($id_item)) :?>
		 <option value="<?php echo $ordering; ?>"><?php echo $ordering; ?></option>
		 <?php endif ;?>
		 <option value="first"><?php echo lang('ionize_label_ordering_first'); ?></option>
		 <option value="last"><?php echo lang('ionize_label_ordering_last'); ?></option>
		 </select>
		 </dd>
		 </dl>
		 <?php endif ;?>

		 */

	}

});

ION.FormField = new Class({

	Implements: [Events, Options],

	options: {
		/*
		 * User's options :
		 *
		 container: '',         // Container ID or container DOM Element
		 class: '',             // DL class
		 label: {
		    text: '',           // label text
		    class: ''           // label class
		 },
		 help: '',              // Help String
		 */
	},

	initialize: function(options)
	{
		this.dl = new Element('dl');
		if (options.class) this.dl.setProperty('class', options.class);

		var dt = new Element('dt').inject(this.dl);

		// Label
		if (options.label)
		{
			this.label = new Element('label', {text: options.label.text}).inject(dt);
			if (options.label.class) this.label.setProperty('class', options.label.class);
			if (options.help) this.label.setProperty('title', options.help);
		}
		this.fieldContainer = new Element('dd').inject(this.dl);

		if (options.container)
		{
			this.container = (typeOf(options.container) == 'string') ? $(options.container) : options.container;
			this.dl.inject(this.container);
		}

		return this;
	},

	adopt: function(field)
	{
		this.fieldContainer.adopt(field);
	},

	getContainer: function()
	{
		return this.fieldContainer;
	},

	getDOMElement: function()
	{
		return this.dl;
	},

	getLabel: function()
	{
		return this.label;
	}
});

ION.Form = {};
ION.Form.Select = new Class({

	Implements: [Events, Options],

	options:
	{
		container:  null,           // Container ID or container DOM Element
		class:      'inputtext',    // CSS class,

		name:       '',             // Name of the Select
		id:         '',             // ID of the select

		post:       {},             // Data to post to the URL
		data:       null,           // JSON array to use as data
		url :       null,           // URL to use as data source

		key:        null,			// Key of the data array to use as value
		label:      null,           // Key of the data array to use as label
		selected:	[],				// Selected Value or array of Selected Values

		fireOnInit: false,			// Fires the onChange event after init.

		rule:       null            // @todo. Rule to apply to the select

		// onDraw: 			function(this, DOMElement select)
		// onChange: 		function(value, data, selected, this)
		// onOptionDraw: 	function(option, row)					// Fired when one option element was drawn
	},

	initialize: function(options)
	{
		this.setOptions(options);

		var self = this,
			o = this.options
		;

		// Select
		this.select = new Element('select', {name: o.name, 'class':o.class});
		if (o.id != '')
			this.select.setProperty('id', o.id);

		// this.setOptions() remove the functions from the options
		// We need to get access to them through the original options object
		if (options.onChange)
		{
			this.select.addEvent('change', function()
			{
				var data = this.getSelected().retrieve('data');
				if (typeOf(data) == 'array') data = data[0];
				options.onChange(this.value, data, this.getSelected(), self.select, self);
			});
		}

		// Container : If set, the select will be injected in this container
		if (o.container)
			this.container = (typeOf(options.container) == 'string') ? $(options.container) : options.container;

		// Get data from one URL
		// One JSON array is expected as result
		if (o.url)
		{
			ION.JSON(
				o.url,
				o.post,
				{
					onSuccess: function(json)
					{
						self.buildOptions(json);
					}
				}
			);
		}
		else if (Object.getLength(o.data) > 0)
		{
			this.buildOptions(o.data);
		}
	},

	onDraw: function()
	{
		var o = this.options;

		// Inject the select into the container
		if (o.container)
			this.select.inject(o.container);

		// onDraw Event gts fired
		this.fireEvent('onDraw', [this.select, this]);

	},

	buildOptions: function(data)
	{
		var self = this,
			o = this.options,
			key = o.key,
			lab = o.label,
			selected = o.selected && typeOf(o.selected) != 'array' ? [o.selected] : [],
			selectedIndex = Object.getLength(selected) == 0 ? o.selectedIndex : null
		;

		Array.each(data, function(row, idx)
		{
			var value = typeOf(row[key]) != 'null' ? row[key] : row;
			var label = typeOf(row[lab]) != 'null' ? row[lab] : (value != null ? value : '');

			if (value != null)
			{
				var opt = new Element('option', {
					value: value,
					text: label
				}).inject(self.select);

				if (selected.contains(value) || (selectedIndex && selectedIndex == idx))
					opt.setProperty('selected', 'selected');

				// Stores the data used to build the option
				// Can be retrieved with : opt.retrieve('data');
				opt.store('data', row);

				self.fireEvent('onOptionDraw', [opt, row]);
			}
		});

		// Fires "change" on init
		if (o.fireOnInit)
			this.select.fireEvent('change');

		this.onDraw();
	}
});
