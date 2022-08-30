//Set table field
let field = {
	code: ["Username", "Password"],
	desc: [],
	isRequired: [1, 1],
	type: ["text", "password"],
	signUpPage: ""
};

if (web_language == "CH") {
	field.desc = ["帳號 (Email)", "密碼"];
	field.signUpPage = "報名請點我";
	pageName = "登入網頁";
}
else if (web_language == "EN") {
	field.desc = ["Email", "Password"];
	field.signUpPage = "Click here to sign up";
	pageName = "Login";
}

//Function Initialization
$(document).ready(function () {
	let temp = "";
	// Clear session
	let stringValue = window.sessionStorage.getItem("loginAccount")
	if (stringValue != null) {
		window.sessionStorage.removeItem("loginAccount");
	}
	showForm();
});

function showForm() {
	let temp = "";
	/* Show Login Form field */
	for (let i = 0; i < field.desc.length; i++) {
		temp += '<tr><td>' + field.desc[i];
		if (field.isRequired[i])
			temp += '<font color="red"> *</font>';

		temp += '</td><td>:&nbsp;<input type="' + field.type[i] + '" id="' + field.code[i] + '" ';

		if (field.type[i] == "password")
			temp += 'onkeyup="SHA256PWD.value = sha256(this.value);" ';

		if (field.isRequired[i])
			temp += 'required';

		temp += '><br></td></tr>';
	}
	temp += '<tr><td colspan="2" align="right"><input id="btnSubmit" type="button" value="Submit" onclick="validateData()"></td></tr>';
	$('#mainTable').html(temp);

	/* Get Organization Information */
	getResource(FHIRURL, 'Organization', '/' + DB.organization, FHIRResponseType, 'getOrganization');
}

function getOrganization(str) {
	let obj = JSON.parse(str);
	if (retValue(obj)) {
		loginData.organization.id = (obj.id) ? obj.id : '';
		loginData.organization.identifier = (obj.identifier) ? obj.identifier[0].value : '';
		loginData.organization.status = (obj.active == true) ? 'Active' : 'Inactive';
		loginData.organization.name = (obj.name) ? obj.name : '';
		if (obj.contact) {
			loginData.organization.cpname = obj.contact[0].name.text;
			obj.contact[0].telecom.map((telecom, i) => {
				if (telecom.system == "email")
					loginData.organization.cpemail = telecom.value;
				else if (telecom.system == "phone")
					loginData.organization.cpphone = telecom.value;
			});
		}
		//organization= new COrganization(id, identifier, status, name, cpname, cpphone, cpemail);
	}
	showWebsiteInfo();
}


//Show Page Title and Header (need to initialize pageName beforehand)
function showWebsiteInfo() {
	document.title = loginData.organization.name + " - " + pageName;
	$("#header").html(loginData.organization.name + "<br>" + pageName);
	message.contactPerson = "please contact " + loginData.organization.cpname + "<br>Phone No.：" + loginData.organization.cpphone + "<br>Email：" + loginData.organization.cpemail;
	$("#cp").html(message.signInFail + message.contactPerson);
}

//Validate data input by user
function validateData() {
	if (checkRequiredField(field)) {
		let id = $("#Username").val();
		getResource(FHIRURL, 'Person', '?identifier=' + id, FHIRResponseType, 'verifyUser');
	}
}

//Verify login account username and password
function verifyUser(str) {
	let obj = JSON.parse(str);
	let retPassword = "";

	if (obj.total == 0) alert(message.accountUnexist);
	else if (obj.total == 1) {
		loginData.person.id = (obj.entry[0].resource.id) ? obj.entry[0].resource.id : '';
		loginData.person.name = (obj.entry[0].resource.name) ? obj.entry[0].resource.name[0].text : '';
		loginData.person.username = (obj.entry[0].resource.identifier[0]) ? obj.entry[0].resource.identifier[0].value : '';
		retPassword = (obj.entry[0].resource.identifier[1]) ? obj.entry[0].resource.identifier[1].value : '';

		if (obj.entry[0].resource.link) {
			obj.entry[0].resource.link.map((link, i) => {
				let roleID = link.target.reference;
				if (roleID.split('/')[0] == "Practitioner") {
					//CPractitioner.roleName = "Practitioner";
					//CPractitioner.practID = roleID.split('/')[1];
					getResource(FHIRURL, 'PractitionerRole', '?practitioner=' + roleID.split('/')[1], FHIRResponseType, 'getPractitionerRole');
					// if (CPractitioner.organizationID == DB.organization)
						// loginData.role.push(CPractitioner);
				}
				else if (roleID.split('/')[0] == "Patient") {
					getResource(FHIRURL, roleID.split('/')[0], '/' + roleID.split('/')[1], FHIRResponseType, 'getPatient');
					// if (CPatient.organizationID == DB.organization)
						// loginData.role.push(CPatient);
				}
			});
		}

		if ($('#SHA256PWD').val() != retPassword) alert(message.passwordWrong);
		else if (!checkUserinOrganization(loginData.role,DB.organization)) alert(message.authorizeFail);
		else {
			sessionSet("loginAccount", loginData, 30);
			var params = (window.location.href).split("?")[1];
			if(params!="" && params!=undefined)
			{
				var decParam = AESdecryptString(params);
				var urlParams = new URLSearchParams(decParam);
				var useFor = urlParams.get('useFor')
				var redirect_uri = urlParams.get('redirect_uri')
				if(useFor == "authentication" && redirect_uri!=undefined){
					var str = "fhirUrl="+FHIRURL+"&&person="+loginData.person.id+"&&role="+loginData.role[0].roleName+"/"+loginData.role[0].practID;
					var param = JWTToken(loginData);//AESencryptString(str)
					//var param = AESencryptString("useFor=authentication;")
					window.open(redirect_uri+'?'+param, "_self");
				}
			}
			else{
			if (loginData.role[0].roleName == "Patient")
				window.open('MedicalRecord/index.html', "_self");
			else if (loginData.role[0].roleName == "Practitioner")
				window.open('MedicalRecord/create.html', "_self");
			}
		}
	}
	else {
		alert(message.systemError + " " + message.contactPerson);
	}
}
// Check wether user is inside the organization
function checkUserinOrganization(roles, organizationName){
	var exist = false;
	roles.forEach(role => {
		if(role.organizationID===organizationName){
			exist = true;}
			});
	return exist;
}
// base64 encode the data
function bs64encode(data) {
  if (typeof data === "object") {
    data = JSON.stringify(data);
  }

  return bs64escape(btoa(data));
}

// modify the base64 string to be URL safe
function bs64escape(string) {
  return string.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64url(source) {
  // Encode in classical base64
  encodedSource = CryptoJS.enc.Base64.stringify(source);

  // Remove padding equal characters
  encodedSource = encodedSource.replace(/=+$/, '');

  // Replace characters according to base64url specifications
  encodedSource = encodedSource.replace(/\+/g, '-');
  encodedSource = encodedSource.replace(/\//g, '_');

  return encodedSource;
}
function JWTToken(loginInfo)
{
	//const HMACSHA256 = (stringToSign, secret) => "not_implemented"

	// The header typically consists of two parts: 
	// the type of the token, which is JWT, and the signing algorithm being used, 
	// such as HMAC SHA256 or RSA.
	const header = {
	 "alg": "HS256",
	 "typ": "JWT",
	  // //"kid": "vpaas-magic-cookie-1fc542a3e4414a44b2611668195e2bfe/4f4910"
	}
	// const encodedHeaders = btoa(JSON.stringify(header))
	
	// The second part of the token is the payload, which contains the claims.
	// Claims are statements about an entity (typically, the user) and 
	// additional data. There are three types of claims: 
	// registered, public, and private claims.
	var roleId = loginData.role[0].roleName+"/"
	roleId += (loginData.role[0].roleName=="Patient")?loginData.role[0].patientID:loginData.role[0].practID;
	//var practitioner = ()?:
	 const claims = {
		 "iss" : FHIRURL,
		 "sub" : FHIRURL +"Person/"+loginData.person.id, //role
		 "aud" : FHIRURL_PHR, // bisa jadi taro phr & sli server
		 "clinet_id" : "", // BROWSER id JS BOM navigator
		 "exp" : 1468000000,
		 "ndf" : 1467000000, //tongchang shiliji youxiao sama kayak 
		 "iat" : 1467000000,
		 "jti" : 1234, //uuid
		 "reason_for_request": "PHR", 
		 "scope" : "", // xian buyong 
		 "requesting_system" : "", //xian buyong
		 "requesting_organization" : "", //xian buyong
		 "requesting_user" :  "", //xian buyong
		 "requesting_practitioner" : "" //xian buyong
	 }
	// const encodedPlayload = btoa(JSON.stringify(claims))
	// create the signature part you have to take the encoded header, 
	// the encoded payload, a secret, the algorithm specified in the header, 
	// and sign that.
	// const signature = HMACSHA256(`${encodedHeaders}.${encodedPlayload}`, "mysecret")
	// const encodedSignature = btoa(signature)

	// const jwt = `${encodedHeaders}.${encodedPlayload}.${encodedSignature}`
	// console.log({jwt})
	
	// base64 encode the header
	// let bs64header = bs64encode({
	  // alg: "HS256",
	  // typ: "JWT"
	// });
	
	var stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
	var encodedHeader = base64url(stringifiedHeader);
	
	var stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(claims));
	var encodedData = base64url(stringifiedData);
	
	var token = encodedHeader + "." + encodedData;
	var secret = "My very confidential secret!";

	var signature = CryptoJS.HmacSHA256(token, secret);
	signature = base64url(signature);

	var signedToken = token + "." + signature;
	//console.log("bs64header :>>\n ", bs64header);

	// var user_id = FHIRURL +loginData.role[0].roleName+"/"+(loginData.role[0].roleName=="Practitioner")?loginData.role[0].practID:loginData.role[0].patientID;
	// base64 encode the payload
	// let bs64payload = bs64encode({
	  // "iss" : FHIRURL,
		// "sub" : user_id,
		// "aud" : FHIRURL_PHR,
		// "clinet_id" : "",
		// "exp" : 1468000000,
		// "ndf" : 1467000000,
		// "iat" : 1467000000,
		// "jti" : 1234,
		// "reason_for_request": "PHR",
		// "scope" : "",
		// "requesting_system" : "[deviceURL]",
		// "requesting_organization" : FHIRURL+"Organization/"+loginData.organization.id,
		// "requesting_user" :  FHIRURL+"Patient/"+(loginData.role[0].roleName=="Patient")?loginData.role[0].patientID:"",
		// "requesting_prectitioner" : FHIRURL+"Practitioner/"+(loginData.role[0].roleName=="Practitioner")?loginData.role[0].practID:""
	// });

	// console.log("bs64payload :>> \n", bs64payload);


	// generate the signature from the header and payload
	// let secret = "0d528cb666023eee0d44e725fe9dfb751263d2f68f07998ae7388ff43b1b504f";
	// let signature = bs64header + "." + bs64payload;

	// let bs64signature = bs64escape(crypto
	  // .createHmac("sha256", secret)
	  // .update(signature)
	  // .digest("base64"));

	// console.log("bs64signature>>", bs64signature);
	//alert(signedToken);
	return signedToken;
}
function hexStringToByteArray(hexString){
	if (hexString.length % 2 !== 0) {
        throw "Must have an even number of hex digits to convert to bytes";
    }/* w w w.  jav  a2 s .  c o  m*/
    var numBytes = hexString.length / 2;
    var byteArray = new Uint8Array(numBytes);
    for (var i=0; i<numBytes; i++) {
        byteArray[i] = parseInt(hexString.substr(i*2, 2), 16);
    }
    return byteArray;
}
function AESencryptString(plainText) {
	var myKey = "DUMMYSALT-VALUE-of-Size-32CHARACTERS"
	var utf_str = CryptoJS.enc.Utf8.parse(plainText);
	var encryptedlogin = CryptoJS.AES.encrypt(utf_str, CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(myKey)),
	{
	   keySize: 128,
	   blockSize: 128,
	   iv: CryptoJS.MD5(CryptoJS.enc.Utf8.parse(myKey)),
	   mode: CryptoJS.mode.CBC,
	   padding: CryptoJS.pad.Pkcs7
	});
	var bytearray = hexStringToByteArray(encryptedlogin.ciphertext.toString());
	// var encode = function(d,a,e,b,c,f){c="";for(a=e=b=0;a<4*d.length/3;f=b>>2*(++a&3)&63,c+=String.fromCharCode(f+71-(f<26?6:f<52?0:f<62?75:f^63?90:87))+(75==(a-1)%76?"\r\n":""))a&3^3&&(b=b<<8^d[e++]);for(;a++&3;)c+="=";return c};

	var base64 = arrayBufferToBase64(bytearray)
	return base64;
}
function arrayBufferToBase64( buffer ) {
	var binary = '';
	var bytes = new Uint8Array( buffer );
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode( bytes[ i ] );
	}
	return window.btoa( binary );
}
function AESdecryptString(cipher) {
	var myKey = "DUMMYSALT-VALUE-of-Size-32CHARACTERS"
	const cipher1 = base64ToByteArray(atob(cipher));
	var cip_hexstring = toHexString(cipher1[0]);
	const ciphertextCP = CryptoJS.lib.CipherParams.create({
	ciphertext: CryptoJS.enc.Hex.parse(cip_hexstring)
	});
	var decrypted = CryptoJS.AES.decrypt(
		ciphertextCP,
		CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(myKey)),
		{ keySize: 128,
	   blockSize: 128,
	   iv: CryptoJS.MD5(CryptoJS.enc.Utf8.parse(myKey)),
		padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC}
	);
	//alert(decrypted.toString(CryptoJS.enc.Utf8));
	return (decrypted.toString(CryptoJS.enc.Utf8));
	
	// var byteArray = btoa(cipher);
	// var ciphertext = byteArray;
	
	// var SHA256 = function a(b) { function c(a, b) { return a >>> b | a << 32 - b } for (var d, e, f = Math.pow, g = f(2, 32), h = "length", i = "", j = [], k = 8 * b[h], l = a.h = a.h || [], m = a.k = a.k || [], n = m[h], o = {}, p = 2; 64 > n; p++)if (!o[p]) { for (d = 0; 313 > d; d += p)o[d] = p; l[n] = f(p, .5) * g | 0, m[n++] = f(p, 1 / 3) * g | 0 } for (b += "\x80"; b[h] % 64 - 56;)b += "\x00"; for (d = 0; d < b[h]; d++) { if (e = b.charCodeAt(d), e >> 8) return; j[d >> 2] |= e << (3 - d) % 4 * 8 } for (j[j[h]] = k / g | 0, j[j[h]] = k, e = 0; e < j[h];) { var q = j.slice(e, e += 16), r = l; for (l = l.slice(0, 8), d = 0; 64 > d; d++) { var s = q[d - 15], t = q[d - 2], u = l[0], v = l[4], w = l[7] + (c(v, 6) ^ c(v, 11) ^ c(v, 25)) + (v & l[5] ^ ~v & l[6]) + m[d] + (q[d] = 16 > d ? q[d] : q[d - 16] + (c(s, 7) ^ c(s, 18) ^ s >>> 3) + q[d - 7] + (c(t, 17) ^ c(t, 19) ^ t >>> 10) | 0), x = (c(u, 2) ^ c(u, 13) ^ c(u, 22)) + (u & l[1] ^ u & l[2] ^ l[1] & l[2]); l = [w + x | 0].concat(l), l[4] = l[4] + w | 0 } for (d = 0; 8 > d; d++)l[d] = l[d] + r[d] | 0 } for (d = 0; 8 > d; d++)for (e = 3; e + 1; e--) { var y = l[d] >> 8 * e & 255; i += (16 > y ? 0 : "") + y.toString(16) } return i };
	// var arrToUintArr = function (a) { for (var l = a.length, b = new Uint8Array(l << 2), o = 0, w, i = 0; i < l; i++) w = a[i], b[o++] = w >> 24, b[o++] = (w >> 16) & 0xff, b[o++] = (w >> 8) & 0xff, b[o++] = w & 0xff; return b; }
	// var computeHash = function (k) { for (var a = [], s = SHA256(k), i = 0; i < 8; i++) a.push(parseInt(s.substr(i * 8, 8), 16)); return arrToUintArr(a); }

	// var key = computeHash(myKey);
	// var sha256myCode = SHA256(myKey);
	
	// var key = CryptoJS.SHA256(myKey).toString();
	// var iv = CryptoJS.MD5(myKey).toString();
	// var key_hexarray = [],iv_hexarray = [];
	// for(var i=0;(i * 8)<8;i++){
		// key_hexarray.push(parseInt(key.substr(i * 8, 8), 16));
		// iv_hexarray.push(parseInt(iv.substr(i * 8, 8), 16));
	// }
	// var key_bytesarray = arrToUintArr(key_hexarray); 
	// var iv_bytesarray = arrToUintArr(iv_hexarray); 
	// var key_bytesarray = tobytearray(key); 
	// var iv_bytesarray = tobytearray(iv); 
	
	
	// var utf_str = CryptoJS.enc.Utf8.parse("useFor=authentication");
	// var encryptedlogin = CryptoJS.AES.encrypt(utf_str, CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(myKey)),
	// {
	   // keySize: 128,
	   // blockSize: 128,
	   // iv: CryptoJS.MD5(CryptoJS.enc.Utf8.parse(myKey)),
	   // mode: CryptoJS.mode.CBC,
	   // padding: CryptoJS.pad.Pkcs7
	// });
	
	// var cipher_same_asc = tobytearray(encryptedlogin.ciphertext.toString());
	
}
function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}
function tobytearray(hexString){
	var key_hexarray = [];
	var arrToUintArr = function (a) { for (var l = a.length, b = new Uint8Array(l << 2), o = 0, w, i = 0; i < l; i++) w = a[i], b[o++] = w >> 24, b[o++] = (w >> 16) & 0xff, b[o++] = (w >> 8) & 0xff, b[o++] = w & 0xff; return b; }
	for(var i=0;(i * 8)<hexString.length;i++){
		key_hexarray.push(parseInt(hexString.substr(i * 8, 8), 16))
	}
	var key_bytesarray = arrToUintArr(key_hexarray); 
	
	return key_bytesarray;
}
function base64ToByteArray(base64String) {
        try {            
            var sliceSize = 1024;
            var byteCharacters = base64String;
            var bytesLength = byteCharacters.length;
            var slicesCount = Math.ceil(bytesLength / sliceSize);
            var byteArrays = new Array(slicesCount);

            for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                var begin = sliceIndex * sliceSize;
                var end = Math.min(begin + sliceSize, bytesLength);

                var bytes = new Array(end - begin);
                for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
                    bytes[i] = byteCharacters[offset].charCodeAt(0);
                }
                byteArrays[sliceIndex] = new Uint8Array(bytes);
            }
            return byteArrays;
        } catch (e) {
            console.log("Couldn't convert to byte array: " + e);
            return undefined;
        }
    }
function getPractitionerRole(str) {
	let obj = JSON.parse(str);
	obj.entry.map((entry, i) => {
		CPractitioner = initiateCPractitioner();
		CPractitioner.roleName = entry.resource.practitioner.reference.split('/')[0];
		CPractitioner.practID = entry.resource.practitioner.reference.split('/')[1];
		CPractitioner.practRoleID = entry.resource.id;
		CPractitioner.organizationID = entry.resource.organization.reference.split('/')[1];
		CPractitioner.organizationName = entry.resource.organization.display;
		entry.resource.code[0].coding.map((coding, i) => {
			CPractitioner.roleCode.push(coding.code);
		});
		loginData.role.push(CPractitioner);
	});
}

function getPatient(str) {
	let obj = JSON.parse(str);
	obj.entry.map((entry, i) => {
		CPatient = initiateCPatient();
		CPatient.roleName = "Patient";
		CPatient.patientID = obj.id;
		CPatient.organizationID = obj.managingOrganization.reference.split('/')[1];
		CPatient.organizationName = obj.managingOrganization.display;
		loginData.role.push(CPatient);
	});
	// CPatient = initiateCPatient();
	// CPatient.roleName = "Patient";
	// CPatient.patientID = obj.id;
	// CPatient.organizationID = obj.managingOrganization.reference.split('/')[1];
	// CPatient.organizationName = obj.managingOrganization.display;
}