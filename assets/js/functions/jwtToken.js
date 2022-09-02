function JWTToken(loginData,endpoint)
{

	// The header typically consists of two parts: 
	// the type of the token, which is JWT, and the signing algorithm being used, 
	// such as HMAC SHA256 or RSA.
	const header = {
	 "alg": "HS256",
	 "typ": "JWT",
	  // //"kid": "vpaas-magic-cookie-1fc542a3e4414a44b2611668195e2bfe/4f4910"
	}
	
	// The second part of the token is the payload, which contains the claims.
	// Claims are statements about an entity (typically, the user) and 
	// additional data. There are three types of claims: 
	// registered, public, and private claims.
	var roleId = loginData.role[0].roleName+"/"
	roleId += (loginData.role[0].roleName=="Patient")?loginData.role[0].patientID:loginData.role[0].practID;
	 const claims = {
		 "iss" : FHIRURL,
		 "sub" : FHIRURL +loginData.userSelectedRole, //role
		 "aud" : endpoint, // bisa jadi taro phr & sli server
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
	var stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
	var encodedHeader = base64url(stringifiedHeader);
	
	var stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(claims));
	var encodedData = base64url(stringifiedData);
	
	var token = encodedHeader + "." + encodedData;
	var secret = "My very confidential secret!";

	var signature = CryptoJS.HmacSHA256(token, secret);
	signature = base64url(signature);

	var signedToken = token + "." + signature;
	return signedToken;
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