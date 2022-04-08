
/*
    說明：由網址列參數取得自身Id，當網址列中無Id，則作為查看第一層資料列表
*/
var url = (QueryString('url') == '') ? '' : QueryString('url');
/*
    getResource(URL, ResourceName, Parameter, ResponseType, AfterFun)
    說明：向Server取資料
    參數：
        URL：Server 路徑
        ResourceName：Resource名稱
        Parameter：向Server要求的參數
        ReponseType：要求Server 回傳的資料型態
        AfterFun：資料取得後欲執行的函式
    JavaScript檔案：getResource.js
    範例：
        取組織資料（自己）
        getResource(FHIRURL,'Practitioner','/1945606',FHIRResponseType,'showResource')
        取自組織資料（子層）
        getResource(FHIRURL,'Practitioner','?partof=1945606',FHIRResponseType,'showResource')
*/

let docRecJSON={
  resourceType: "DocumentReference",
  status: "current",
  type: {
    coding: [ {
      system: "https://build.fhir.org/valueset-doc-typecodes.html",
      code: "11503-0",
      display: "Medical records"
    } ]
  },
  subject: {
    reference: ""
  },
  date: getTodayDate("datetime"),
  authenticator: {
    reference: "PractitionerRole/",
    display: "Doctor name"
  },
  custodian: {
    reference: "Organization",
    display: "Hospital name"
  },
  content: [ {
    attachment: {
      url: "",
      title: ""
    }
  } ]
}


//Function Initialization
$(document).ready(function(){
	/* Check session */
	loginData= sessionGet("loginAccount");
	if(loginData==null) {
		//redirect users to login page
		window.location.href = "../login.html";
	}
	else {
		//Get user control access range
		//getResource(FHIRURL, 'Patient', '?organization=' + loginData.organization.id, FHIRResponseType, 'getPractRoleByOrganization');
		getResource(url, '', '', FHIRResponseType, 'showVaccineFormat');
	}
});

/*
    說明：點擊"新增"後，切換至Add.html新增子組織
*/
// document.querySelector('.Btn.Add.Practitioner').onclick = function () {
    // location.href = '../Practitioner/Add.html?id=' + id;
// }
// document.querySelector('.Btn.Add.Patient').onclick = function () {
//     location.href = '../Patient/Add.html?id=' + id;
// }
// document.querySelector('.Btn.Add.PractitionerRole').onclick = function () {
//     location.href = '../PractitionerRole/Add.html?id=' + id;
// }

function showVaccineFormat(str) {
	let obj= JSON.parse(str);
    let template = [];
	
	let vaccineCertCode= obj.id;
    obj.entry.map((entry, i) => {
		if(entry.resource.resourceType == 'Immunization')
		{
			let targetDisease = (entry.resource.protocolApplied[0].targetDisease[0].coding[0].code) ? entry.resource.protocolApplied[0].targetDisease[0].coding[0].code : '';
			let dose = (entry.resource.protocolApplied[0].doseNumber) ? entry.resource.protocolApplied[0].doseNumber : '';
			let date =(entry.resource.occurrenceDateTime) ? entry.resource.occurrenceDateTime : '';
			let vaccineType =(entry.resource.vaccineCode.coding[0].display) ? entry.resource.vaccineCode.coding[0].display : '';
			let status = (entry.resource.status) ? entry.resource.status : '';
			
			template.push(`
			<table id="vaccine">
				<tr><td id="bold">Disease Type</td><td>: ${targetDisease}</td></tr>
				<tr><td id="bold">Date</td><td>: ${date}</td></tr>
				<tr><td id="bold">Vaccine Type</td><td>: ${vaccineType}</td></tr>
				<tr><td id="bold">Dose</td><td>: ${dose}</td></tr>
			</table>`)
		}
    })
    document.getElementById('List').getElementsByClassName('List-MRDetails')[0].getElementsByClassName('Bodyer')[0].innerHTML += template.join('');
}


function addParameter(v1, v2){
	var tableParam = document.getElementById("TableMR");
	var row = tableParam.insertRow(-1);
	row.align="left";
	row.insertCell(0).innerHTML = '<input type="text" value="' + v1 + '">';
	row.insertCell(1).innerHTML = '<input type="text" value="' + v2 + '">';
	row.insertCell(2).innerHTML = '<button onclick="delParam(this)">delete</button>'
}		

function delParam(row){
	var index= row.parentNode.parentNode.rowIndex;
	var tableParam = document.getElementById('TableMR');
	var count = tableParam.rows.length;
	tableParam.deleteRow(index);
}


function updateMR(){
	document.getElementById("global-loader").style.display="block";
	let patientID= (document.getElementById('patientID').value == '')? '' : document.getElementById('patientID').value;
	let MRDesc= (document.getElementById('MRDesc').value == '')? '' : document.getElementById('MRDesc').value;
	let MRUrl= (document.getElementById('MRUrl').value == '')? '' : document.getElementById('MRUrl').value;
	
	//var tableParam = document.getElementById('TableMR');
	//var count = tableParam.rows.length;
	// for(var i=1;i<count;i++)
	// {
		// let desc= tableParam.rows[i].cells[0].children[0].value;
		// let url= tableParam.rows[i].cells[1].children[0].value;
		
		// docRecJSON.content[0].attachment.title= desc;
		// docRecJSON.content[0].attachment.url= url;
	// }
	
	docRecJSON.subject.reference= "Patient/" + patientID;
	docRecJSON.authenticator.reference= "PractitionerRole/" + loginData.role[0].practRoleID,
    docRecJSON.authenticator.display= loginData.person.name;
	docRecJSON.custodian.reference= "Organization/" + loginData.role[0].organizationID,
	docRecJSON.custodian.display= loginData.role[0].organizationName;
	docRecJSON.content[0].attachment.title= MRDesc;
	docRecJSON.content[0].attachment.url= MRUrl;
		
	postResource(FHIRURL, 'DocumentReference', '', FHIRResponseType, "uploadedResult", JSON.stringify(docRecJSON));
}

function uploadedResult(str){
	let obj= JSON.parse(str);
	let retVal= retValue(obj);
	if(retVal==0) alert('Error!');
	else alert('Finished!\nFHIR Resource ID: ' + retVal);
}