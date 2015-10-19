$(function(){
   $('#LIST').change(function () {
       if ($('#LIST option:selected').text() == "Manual"){
           getServerList(Selected);
           $('.serverlist').hide();
           $('#SERVER').show();
       } else {
           $('.serverlist').hide();
       } 
   });
   
   if ($('#LIST option:selected').text() == "Manual"){
		getServerList(Selected);
      $('.serverlist').hide();
      $('#SERVER').show();
   }

	//create share image dialog
	$('#dialog').dialog({
   	autoOpen: false,
    	dialogClass: 'no-close',
      open: function(){
	      $('#shareImage').click(function() {
	      	 $("#dialog").dialog("close"); 
	      });
		}
	});

	//bind Clear button to clearData function
	$("#btnClearData").bind("click", clearData);

	//toggle all check boxes
	$('#allData').click(function(event) {  //on click
   	if(this.checked) { // check select status
      	$('.checkData').each(function() { //loop through each checkbox
         	this.checked = true;  //select all checkboxes with class "checkData"              
         });
      }else{
         $('.checkData').each(function() { //loop through each checkbox
            this.checked = false; //deselect all checkboxes with class "checkData"                      
      	});        
      }
   });

   //tablesorter
	$('#tblData').tablesorter({headers:{0:{sorter:false}}});

	//load table from xml
	parseDataXML();
});

function getServerList(Selected){
  	$.ajax({
      type: "GET",
      dataType: "json",
   	url: "/plugins/speedtest/include/speedtest-list.php",
      data: "{}",
   	success: function(data) {
	   	var serverList= "<option ";
	   	if (Selected === ""){
	   		serverList+= "selected='' ";
	   	}
   		for (var i = 0; i < data.length; i++){
	   		serverList+= "<option "; 
	   		if (data[i][0] === Selected){
	   			serverList+= "selected='' ";
	   		}
	   		serverList+= "value='" + data[i][0] + "'>" + data[i][1] + "</option>";
			}
		   $("#SERVER").html(serverList);
		},
      error : function() {},
      cache: true
	});
};

function resetDATA(form) {
	form.SECURE.value = "";
	form.SHARE.value = "--share";
	form.UNITS.value = "";
	form.LIST.value = "auto";
	form.SERVER.value = "";
};

function parseDataXML(){
  	$.ajax({
   	type: "GET",
   	url: "/plugins/speedtest/speedtest.xml",
   	dataType: "xml",
   	success: function(xml) {
			$(xml).find("test").each(function(){
				var Name = "";
				var Ping = "";
				var Download = "";
				var Upload = "";
				var Share = "";
				Name = $(this).attr("name");
				Ping = $(this).attr("ping");
				Download = $(this).attr("download");
				Upload = $(this).attr("upload");
				Share = $(this).attr("share");
	  			if (typeof(Share) === "undefined"){
		   		Share = "";
		   	}
				$("#tblData tbody").append(
				"<tr>"+
				"<td><input class='checkData' type='checkbox' value="+Name+"></td>"+ //checkbox
				"<td>"+Ping+"</td>"+ //Ping
				"<td>"+Download+"</td>"+ //Download
				"<td>"+Upload+"</td>"+ //Upload
				"<td><a onclick=\"$('#shareImage').attr('src', '"+Share+"');"+
				"$('#dialog').dialog('open');\" href='#'>"+Share+
				"</a></td>"+ //Share
				"</tr>");
			});
   	},
       error : function() {}
	});
};

function beginTEST(form){
	var Options = '';
	if (form.LIST.value == "manual") {
		Options = "--server " + form.SERVER.value + " ";
  	}
	if (form.SECURE.value == "secure") {
		Options += " --secure ";
	} 
	if (form.SHARE.value == "share") {
		Options += " --share ";
	} 
	if (form.UNITS.value == "bytes") {
		Options += " --bytes ";
	}
	form.btnBegin.disabled = "disabled";
	$("#tblData tbody").append(
		"<tr id='loading'>"+
		"<td></td><td><img src='/plugins/dynamix/images/loading.gif'></td>"+
		"<td><img src='/plugins/dynamix/images/loading.gif'></td>"+
		"<td><img src='/plugins/dynamix/images/loading.gif'></td>"+
		"<td><img src='/plugins/dynamix/images/loading.gif'></td>"+
		"</tr>");
	$('#countdown').html('<font class="green">Testing Internet Bandwidth...</font>');

  	$.ajax({
      type: "POST",
      dataType: "json",
   	url: "/plugins/speedtest/include/speedtest.php",
   	data : {options: Options},
   	success: function(data) {
   		var Name = $.now();
   		var Share = "";
   		if (data.length > 3){
				Share = data[3][1];
   			if (typeof(Share) === "undefined"){
		   		Share = "";
  				}
   		} 
 			$("#loading").remove();
			$('#countdown').empty();
			$("#tblData tbody").append(
			"<tr>"+
			"<td><input class='checkData' type='checkbox' value="+Name+"></td>"+ //checkbox
			"<td>"+data[0][1]+"</td>"+ //Ping
			"<td>"+data[1][1]+"</td>"+ //Download
			"<td>"+data[2][1]+"</td>"+ //Upload
			"<td><a onclick=\"$('#shareImage').attr('src', '"+Share+"');"+
			"$('#dialog').dialog('open');\" href='#'>"+Share+
			"</a></td>"+ //Share
			"</tr>");
			$("#tblData").trigger("update"); //update sensor table for tablesorter
			form.btnBegin.disabled = false;
			StoreData();
 		},
       error : function() {},
       cache: false
	});
};

function StoreData() {
	$("#tblData").trigger("update");
	var tblDataXML = '<?xml version="1.0"?><tests>';
   $('#tblData tbody tr').each(function(row, tr){
		var Name = $(tr).children("td:nth-child(1)").find('input').val();
		var Ping = $(tr).children("td:nth-child(2)").html();
		var Download = $(tr).children("td:nth-child(3)").html();
		var Upload = $(tr).children("td:nth-child(4)").html();
		var Share = $(tr).children("td:nth-child(5)").find('a').text();
		if (typeof(Share) === "undefined"){
   		Share = "";
   	}
		tblDataXML += '<test name="'+Name+'" ping="'+Ping+'" download="'+Download+'" upload="'+Upload+'" share="'+Share+'"/>';
	});
	tblDataXML += '</tests>';

	$.ajax({
		type: 'POST',
	   url: "/plugins/speedtest/include/save.php",
  	  	dataType: 'xml',
  	  	data: {filename: "/boot/config/plugins/speedtest/speedtest.xml",
  	  	content: tblDataXML},
  	  	error: function() {
  	   	alert("Unknown error. Data could not be written to the file.");
  	  	},
  	  	success: function () {
  	  	}
	});
};


function clearData() {
	//if all data checked clear all
	if($('#allData').prop('checked')) {
 		$("#tblData tbody").empty();
 		$('#allData').attr('checked', false);
	} else {
	// clear only checked data
   $(':checkbox:checked').each(function(){
  		$(this).parent().parent().remove(); //remove table row
   	});
   }
	StoreData();
};