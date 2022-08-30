//Set FHIR Server URL and response type (json or xml)
var FHIRURL = "https://203.64.84.150:58443/portaltest1/fhir/" //default FHIR Server API
// 'https://hapi.fhir.org/baseR4/';		
var FHIRURL_PHR = "https://203.64.84.150:58443/fhirtest1/fhir/" 
var FHIRResponseType= 'json';						//Requested data type returned by the server
	
//Define required FHIR resources
let DB={
	organization: "MIPatientPortal",	
	library: "2862114", 				//System module and menu mapping
	group: "2862615",					//User RBAC
};