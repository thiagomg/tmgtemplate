function TmgTemplate() {

	function getAttrName(attr, name) {
		if( attr != null ) {
			for(var idx=0; idx < attr.length; idx++) {
				var obj = attr[idx];
				if( obj.nodeName==name ) {
					return obj.nodeValue;
				}
			}
		}
		return "";
	}

	function getTemplateByName(name)
	{
		var el = document.getElementsByTagName("script");
		for(idx in el) {
			var obj = el[idx];
			if( obj.type == "text/tmg-template" ) {
				if( getAttrName(obj.attributes, "name") == name ) {
					//we found it.
					return "<root>" + obj.text + "</root>";
				}
			}
		}
		return "";
	}

	function loadXml(sXml)
	{
		try //Internet Explorer
		{
			xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async="false";
			xmlDoc.loadXML(sXml);
		}
		catch(e)
		{
			try //Firefox, Mozilla, Opera, etc.
			{
				parser=new DOMParser();
				xmlDoc=parser.parseFromString(sXml,"text/xml");
			}
			catch(e)
			{
				alert(e.message);
				return;
			}
		}
		return xmlDoc;
	}

	function dumpNode(node)
	{
		var arr = new Array();
		var n=node.childNodes;
		for(var i=0; i < node.childNodes.length; i++) {
			var obj=node.childNodes[i];
			//alert(obj.nodeType);
			if( parseInt(obj.nodeType,10) == 3 ) { //Text
				arr.push("=_" + obj.data + "_");
				
			} else if( parseInt(obj.nodeType, 10) == 1 ) { //Node
				arr.push("{" + obj.nodeName);
				var attr=obj.attributes;
				if( attr != null ) {
					for(var j=0; j < attr.length; j++) {
						arr.push(" " + attr[j].nodeName + "='" + attr[j].nodeValue + "'");
					}
				}
				var buf=""+dumpNode(obj);
				if( buf.length > 0 ) {
					arr.push("}");
					arr.push(buf);
					arr.push("{/" + obj.nodeName + "}");
				} else {
					arr.push("/}");
				}
			}
		}

		return arr.join('');
	}

	function getKey(value, data)
	{
		var arr=new Array();
		//if( init == undefined ) init = 0;
		var init=0;
		
		ini=value.indexOf("${", init);
		if( ini == -1 ) {
			if( data == undefined ) {
				return null;
			} else {
				return value;
			}
		}
		if( ini > 0 ) arr.push(value.substr(init, ini));
		ini+=2;
		var fim=value.indexOf("}", ini);
		if( fim == -1 ) {
			return null; //error in template
		}

		if( data == undefined ) {
			arr.push(value.substr(ini, fim-ini));
		} else {
			var k=value.substr(ini, fim-ini);
			var buf = data[k];
			/*if( buf !== undefined ) {
				buf = gadgets.util.escapeString(buf);
			}*/
			if( buf === undefined ) {
				buf=")___NADA___(";
			}
			arr.push(buf);
		}

		fim++;
		if( fim < value.length ) {
			var buf = getKey(value.substr(fim), data);
			arr.push( buf );
		}

		return arr.join('');
	}

	function applyData(value, data)
	{
		var arr=new Array();

		var ret = getKey(value, data);
		if( ret != null ) {
			return ret;
		} else {
			return value;
		}
	}

	function renderNode(arr, obj, rec)
	{
		arr.push("<" + obj.nodeName);
		var attr=obj.attributes;
		if( attr != null ) {
			for(var j=0; j < attr.length; j++) {
				if( attr[j].nodeName != "if" && attr[j].nodeName != "repeat" ) {
					var text = attr[j].nodeValue;
					if( text.indexOf("eve_complemento") >= 0 ) {
						var text = text;
					}
					arr.push(" " + attr[j].nodeName + "=\"" + applyData(attr[j].nodeValue, rec) + "\"");
				}
			}
		}
		var buf=""+parseNode(obj, rec);
		if( buf.length > 0 ) {
			buf = buf.replace(')___NADA___(', '');
			arr.push(">");
			arr.push(buf);
			arr.push("</" + obj.nodeName + ">");
		} else {
			arr.push("/>");
		}

	}

	function parseNode(node, data)
	{
		var arr = new Array();
		var n=node.childNodes;
		for(var i=0; i < node.childNodes.length; i++) {
			var obj=node.childNodes[i];
			
			if( parseInt(obj.nodeType,10) == 3 ) { //Text
				//obj.data = obj.data.replace(')___NADA___(', '');

				arr.push(applyData(obj.data, data));
				
			} else if( parseInt(obj.nodeType, 10) == 1 ) { //Node

				var recs;
				var isList=false;
				var ifData=getAttrName(obj.attributes, "if");
				if( ifData.length > 0 ) {
					var cond=getKey(ifData, data);
					var show=false;
					//if( cond === null ) cond = "false";
					cond = "" + cond;
					if(cond.length == 0 || cond == "!") cond = "true";
					if(cond == ")___NADA___(") cond=false;
					eval("if(" + cond + ") show=true;");
					if( !show ) {
						continue;
					}
				}
				
				var rpData=getAttrName(obj.attributes, "repeat");
				if( rpData.length > 0 ) {
					var key = getKey(rpData);
					var isList=true;
					recs=data[key];
				}

				if( !isList ) {
					recs=new Array();
					recs.push(data);
				}

				if( !(recs == undefined) ) {
					for(var li=0; li < recs.length; li++) {
						renderNode(arr, obj, recs[li]);
					}
				}
			}
		}

		return arr.join('');
	}

	this.parseTemplate = function(name, data) {
		tpl = getTemplateByName(name);
		xml = loadXml(tpl);
		return parseNode(xml.firstChild, data).replace(")___NADA___(","");
	}

}
