function hexStringToByteArray(hexString){
	if (hexString.length % 2 !== 0) {
        throw "Must have an even number of hex digits to convert to bytes";
    }
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
	return (decrypted.toString(CryptoJS.enc.Utf8));
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
function toHexString(byteArray) {
	return Array.from(byteArray, function(byte) {
	  return ('0' + (byte & 0xFF).toString(16)).slice(-2);
	}).join('')
  }