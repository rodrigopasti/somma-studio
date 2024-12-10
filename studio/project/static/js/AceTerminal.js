	var BlockID
    $( "body" ).dblclick(function( event ) {
    		var text
			logs = event.target.id;
			var logs
			var code //= document.getElementById(logs+'x').innerHTML
			console.log(logs);
			text = document.getElementById(logs+'x').innerHTML
			if (text.length > 1){
			console.log(text)
			}
			else{
			text = "class "+logs+'x'+':';
			}
			//console.log(text)
			document.getElementById(logs+'x').innerHTML = text;
			//console.log(code)
			//console.log(document.getElementById(logs+'x').innerHTML);
			//var e = 
			//code = 
			//console.log(count)
			editor.setValue("")
			
				
			code = text;
			var pos = editor.selection.getCursor();
			var session = editor.session;
				
			session.insert({
			row: session.getLength(), // or you can use "pos.row"
			column: pos.column,
			}, "" + text + " ");

			BlockID = logs;
			console.log(BlockID)

		});
    function salvar_codigo(){
    	console.log("Bloco Salvo: "+BlockID)
    	document.getElementById(BlockID+"x").innerHTML = editor.getSession().getValue();
    	console.log(document.getElementById(BlockID+"x").innerHTML)
    };
   // function gerar_custom(id){
    	
	
		var editor = ace.edit("editor");
	    editor.setTheme("ace/theme/monokai");
	    editor.setOptions({
		  fontSize: "16pt"
		});
	    editor.session.setMode("ace/mode/python");
