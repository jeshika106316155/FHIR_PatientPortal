
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