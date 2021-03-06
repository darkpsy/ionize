<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Ajaxform_Process
{
	public static $ci;

	public function __construct()
	{
		self::$ci =& get_instance();

		self::$ci->load->library('email');
	}

	/**
	 * Processes the Contact Form
	 * Default behavior
	 *
	 * To replace by your method, simply copy this class into /themes/your_theme/libraries/
	 * and change this method.
	 *
	 * Do not forget to declare this process method in /themes/your_theme/config/forms.php :
	 *
	 * $config['forms'] = array
	 * (
	 * 		// Contact form
	 * 		'contact' => array
	 * 		(
	 * 			// The method which will process the form
	 * 			'process' => 'Ajaxform_Process::process_contact',
	 *
	 * 			...
	 * 		)
	 *  );
	 *
	 * @param $form		Form settings array
	 *
	 */
	public static function process_contact($form)
	{
		$post = self::$ci->input->post();

		// ionize dedicated method, added to the orginal CI Email library
		return self::$ci->email->send_form_emails($form, $post);
	}


	/*
	 *
	public static function process_my_crazy_form($form)
	{
		$post = self::$ci->input->post();

		//
		// Do what you want here ...
		//
	}
	*/

}
