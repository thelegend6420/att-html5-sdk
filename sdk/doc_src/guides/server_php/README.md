HTML5 SDK Server (PHP Implementation)
===

This guide provides instructions for configuring an Apache web server so that the HTML5 SDK may correctly access the PHP server components. This also allows you to access the PHP server routines as a standalone toolkit, should you desire to create your own tools for accessing the AT&T APIs.

Assumptions
---
This guide assumes that you have a functioning Apache web server running on your development environment with a cURL-enabled PHP module installed. If you do not have access to a running Apache server with PHP that meets these requirements, see our [PHP Server Environment Setup](#!/guide/server_php_env) for guidelines on obtaining and installing these packages.

Required Configurations
----

- Apache
	- The **mod_negotiation** and **mod_alias** modules must be loaded in the Apache HTTP server. These modules are required for both the Alias and Multiviews switches used when configuring your SDK virtual host, an example of which is shown in the Configuring Apache to Access the SDK section below.

- PHP
	- PHP must have cURL support enabled. To test this, create a script that calls `phpinfo()` and view it in a browser to it to see your current PHP configuration.
	- In your php.ini file, the **short_open_tag** setting should be set to **On**.
	- Optionally setting **display_errors = Off** in php.ini will prevent errors from interfering with the app.

- Review the documentation and account setup instructions found on the AT&T website.


Unpacking the SDK
---

Copy the SDK zip file to the directory where you wish the SDK to reside. This can be a new directory specifically created for the SDK and any application you wish to create, or this can be an existing directory with files that you wish to use with the SDK. 

Configuring Apache to Access the SDK 
---

To use this SDK, we suggest that you configure your webserver with a virtual host that has the **DocumentRoot** set to the path where you unzipped the SDK.

Please note that this example shows the minimum requirements needed for proper configuration. Any additional configuration that may be required by your application is beyond the scope of this documentation. 

After installing PHP on your machine and verifying that the Apache web server is running properly, you can create a virtual directory pointing to the SDK PHP server as follows:

	# Create a convenience alias which points to the SDK PHP server root directory
	# This alias will be used when setting up your application in your ATT developer account

	<Directory "[docroot]/server/php/public_html/att">
		Options MultiViews FollowSymLinks
		AllowOverride None
		Order allow,deny
		Allow from all
		Require all granted
	</Directory>
	Alias /att [docroot]/server/php/public_html/att
	
	<Directory "[docroot]/webcontent">
		Options MultiViews
		AllowOverride all
		Order Allow,Deny
		Allow from all
		Require all granted
	</Directory>
	Alias /webcontent "[docroot]/webcontent"

Replace ___[docroot]___ with the full path of the location where you unzipped the SDK. Required settings for this example are:

* **Server** - 
The virtual name of the website where your application and SDK will reside. (e.g. application.mysite.com) This can be either a locally mapped domain name (in your /etc/hosts file) or a name configured in your DNS server.

- **DocRoot** - The directory where you unpacked the SDK.

- **Alias** - a shortcut virtual directory for use in your application configuration in your ATT Developer account and by the SDK PHP server itself.

- **Options MultiViews** - Multiviews must be enabled for the SDK directory. Using this switch turns this Apache feature on for the specified directory.

- **Options FollowSymLinks** - FollowSymLinks must be enabled for the SDK directory. Using this switch turns this Apache feature on for the specified directory.


SDK PHP Server Configuration
---

Once you have configured your virtual server, you must configure the SDK PHP Server with proper authorization credentials to allow it to communicate with the AT&T APIs. To complete this step, you must have first configured an application in AT&T Developer Program account.

Open ___[docroot]___/server/php/public_html/att/config.php and update the following settings:

	$config = array(

	  # AppKey and Secret are from the AT&T Developer Program website
	  "AppKey" => "XXXXXX",
	  "Secret" => "XXXXXX",

	  # The address of the locally running server. This is used when a callback URL is
	  # required when making a request to the AT&T APIs.
	  # IMPORTANT - REMOVE TRAILING SLASHES FROM SERVER NAMES
	  "localServer" => "http://127.0.0.1:4567",

	  # ATT API configuration - do not modify these values unless you know what you're doing.
	  # apiHost is the main endpoint through which all API requests are made.
	  "apiHost" => "https://api.att.com",
	  
	  # clientModelScope is the string of api scopes your application requires access to.
	  "clientModelScope"  => "SMS,MMS,SPEECH,STTC,TTS,ADS,PAYMENT",
	
	  "defaultGrammarFile" => "grammar.srgs",
	  "defaultDictionaryFile" => "dictionary.pls",
	);

Modify the configuration settings to match the application you created, making sure that the OAuth callback matches your PHP server settings.
 Default is 'http://localhost:4567/att/callback.php'

Debugging
---

Logging to a dedicated log file can also be configured in the same config.php file.

	define("DEBUG", "1");
	define("DEBUG_LOGGER", "/some/writable/absolute/path/att-php.log");

Certificate Bundle
---

The default option for cURL connections in the PHP server is to verify and authenticate the SSL certificates presented by the AT&T API servers. If you wish to provide your server with this level of security, you must ensure that cURL is configured with an up-to-date certificate bundle. Most server environments will not require this step.

If you have problems connecting to the AT&T APIs while this feature is enabled, disabling the SSL checks may correct any connection problems. If it does, the certificate bundle is out of date or missing, and should be updated.

To turn off verification, modify the following line in the **config.php** file of the SDK PHP server:

	define("ENABLE_SSL_CHECK", false);	

For more information about the location of the certificate bundle on your server, and how to update it, please visit the following pages:

	http://curl.haxx.se/docs/sslcerts.html

	http://wiki.cacert.org/FAQ/ImportRootCert


Running the Application
---
Your application should now be configured and ready to use. Open http://[yourhost]:[yourport]/ in a supported browser and start exploring the '/webcontent' virtual directory for samples.


