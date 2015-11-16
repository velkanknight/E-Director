    /* global UNKNOWN, atvs */

$(document).ready(function () {
    //inicializar e carregar os processos
    var atvs = [];
    var R = Raphael("canvas");
    var id = 0, setado = false, validar = true, acao = "";
    var inicio = null, nfolhas, nomeArq;

    //trocar de layout
    $('#l1').click(function () {
        $('link[rel="stylesheet"]').attr('href', 'css/estilo.css');
    });
    $('#l2').click(function () {
        $('link[rel="stylesheet"]').attr('href', 'css/estilo2.css');
    });
    $('#l3').click(function () {
        $('link[rel="stylesheet"]').attr('href', 'css/estilo3.css');
    });

    //esconder as ferramentas até que o login seja feito
    $('#menu').hide();
    $('#dir').hide();
    $('#canvas').hide();
    $('#nome').focus();

    $('#btnLogin').click(function () {
        if ($('#nome').val() === "admin" && $('#senha').val() === "admin") {
            $('#framelogin').hide();
            $('#menu').show(500);
            $('#dir').show(500);
            $('#canvas').show(500);
            $('.error').text("");
        } else {
            $('.error').text("Usuário ou senha inválidos.");
        }
    });

    //criar, carregar e salvar os processos
    $('#btnNew').click(function (evt) {
        acao = "";
        $('#dir').html("<h4 align='center'>Criar Processo</h4>\n\
        &nbspNome:<br> \n\
        &nbsp<input type='text' id='txtNew'/><br>\n\
        <div class='btn-default' id='new'>Criar</div> <div class='btn-default' id='cancel'>Cancelar</div>\n\
        <br><p class='error'></p>");
        $('#txtNew').focus();
    });
    $('#btnLoad').click(function (evt) {
        acao = "";
        var process = "";
        for (var key in localStorage) {
            process += "<div class='btn-default' id='" + key + "'>" + key + "</div>";
        }
        $('#dir').html("<h4 align='center'>Carregar Processo</h4>" + process +
                "<div class='btn-default' id='cancel'>Cancelar</div>\n\
        <br><p class='error'></p>");
    });

    $('#btnSave').click(function () {
        acao = "";
        var temp = [];
        $.getJSON("local/RegrasBD.json", function (data) {
            for (var i in data) {
                if (nomeArq === data[i].nome) {
                    for (var j in data[i].seq) {
                        temp.push(data[i].seq[j]);
                    }
                    break;
                }
            }
            var val = regras(temp);
            if (nomeArq !== null && val) {
                localStorage.setItem(nomeArq, JSON.stringify(atvs));
                $('#dir').html("<p class='sucess'>Arquivo salvo com sucesso.</p>");
            } else if (!val) {
                $('#dir').html("<p class='error'>Sequencia inválida.</p>");
            }
        });
    });

    $('#dir').click(function (event) {
        event.stopPropagation();
        //gerenciamento dos arquivos locais
        if ($(event.target).prop('id') === 'new') {
            if ($('#txtNew').val() !== '') {
                atvs = [];
                nomeArq = $('#txtNew').val();
                $('#dir').html("<p class='sucess'>Arquivo criado.</p>");
            } else {
                $('.error').text("Nome inválido.");
            }
        }
        for (var key in localStorage) {
            if ($(event.target).prop('id') === key) {
                nomeArq = key;
                atvs = [];
                var atv = JSON.parse(localStorage.getItem(nomeArq));
                for (var i in atv) {
                    atvs.push({x: atv[i].x, y: atv[i].y, nome: atv[i].nome, desc: atv[i].desc, filhos: atv[i].filhos, raiz: atv[i].raiz, tipo: atv[i].tipo});
                }
                id = atvs.length;
                $('#dir').html("<p class='sucess'>Processo "+nomeArq+" carregado.</p>");
            }
        }
        //gerenciamento das alterações de atividades
        if ($(event.target).prop('id') === 'desc') {
            var temp = $('#dir input').attr('id');
            if ($(temp) !== '') {
                temp = temp.split("-");
                atvs[temp[1]].desc = $('#txtDesc-' + temp[1]).val();
                $('#dir').html("");
            } else {
                $('.error').text("Nome inválido.");
            }
        }
        if ($(event.target).prop('id') === 'tip') {
            var temp = $('#dir input').attr('name');
            temp = temp.split("-");
            atvs[temp[1]].tipo = $('[name=rbTipo-' + temp[1] + ']:checked').val();
            $('#dir').html("<h5 align='center'>Selecione uma atividade para alterar o seu rótulo.<h5>");
        }
        if ($(event.target).prop('id') === 'cancel') {
            $('#dir').html("");
        }
        update(event);
    });

    //botões de manipulação
    $('#btnLabel').click(function () {
        acao = "rot";
        $('#dir').html("<h5 align='center'>Selecione uma atividade para alterar o seu rótulo.<h5>");
    });
    $('#btnCon').click(function () {
        acao = "con";
        $('#dir').html("<h5 align='center'>Selecione duas atividades (origem/destino).<h5>");
    });
    $('#btnDc').click(function () {
        acao = "dc";
        $('#dir').html("<h5 align='center'>Selecione uma atividade para remover as ligações posteriores com outras atividades.<h5>");
    });
    $('#btnAdd').click(function () {
        acao = "add";
        $('#dir').html("<h5 align='center'>Clique no painel de desenho para adicionar uma atividade.<h5>");
    });
    $('#btnRem').click(function () {
        acao = "rem";
        $('#dir').html("<h5 align='center'>Clique em uma atividade para removê-la (qualquer ligação com esta também será removida).<h5>");
    });
    $('#btnTip').click(function () {
        acao = "tip";
        $('#dir').html("<h5 align='center'>Selecione uma atividade para alterar o seu tipo.<h5>");
    });
    $('#btnOrg').click(function (event) {
        //update(event);
    });
    $('#btnInfo').click(function () {
        acao = "info";
        $('#dir').html("<h5 align='center'>Selecione uma atividade para ver suas informações.<h5>");
    });
    //QUADRO DESENHO 
    $('#canvas').click(function (event) {
        //evitando conflitos de eventos em objetos dinâmicos
        event.stopPropagation();
        for (var i in atvs) {
            if ($(event.target).prop('id') === atvs[i].nome || $(event.target).prop('id') === atvs[i].desc) {
                if (acao === "con") {
                    setado = !setado;
                    if (setado) {
                        inicio = {x: atvs[i].x, y: atvs[i].y, atv: i};
                        $('#dir').html("<h5 align='center'>Selecione a atividade destino.<h5>");
                    } else {
                        atvs[inicio.atv].filhos.push(atvs[i].nome);
                        validar = true;
                        verificar(atvs[inicio.atv], atvs[i]);
                        if (validar) {
                            atvs[i].raiz = false;
                            inicio = null;
                            $('#dir').html("<h5 align='center'>Selecione duas atividades (origem/destino).<h5>");
                        } else {
                            atvs[inicio.atv].filhos.pop();
                            setado = !setado;
                            $('#dir').html("<p class='error'>Ligação inválida. Selecione outra atividade</p>");
                        }
                    }
                }
                if (acao === "dc") {
                    atvs[i].filhos=[];
                }
                if (acao === "rot") {
                    $('#dir').html("<h4 align='center'>Alterar Rótulo</h4>\n\
                    &nbspNovo Rótulo:<br> \n\
                    &nbsp<input type='text' id='txtDesc-" + i + "'/><br>\n\
                    <div class='btn-default' id='desc'>Alterar</div> <div class='btn-default' id='cancel'>Cancelar</div>\n\
                    <br><p class='error'></p>");
                    $('#txtDesc-' + i).focus();
                    $('#txtDesc-' + i).val(atvs[i].desc);
                }
                if (acao === "tip") {
                    $('#dir').html("<h4 align='center'>Alterar Tipo</h4>\n\
                    &nbsp<input type='radio' name='rbTipo-" + i + "' value='ter'/> Terminal<br><br>\n\
                    &nbsp<input type='radio' name='rbTipo-" + i + "' value='proc'/> Processo Unitário<br><br>\n\
                    &nbsp<input type='radio' name='rbTipo-" + i + "' value='doc'/> Documento<br><br>\n\
                    &nbsp<input type='radio' name='rbTipo-" + i + "' value='dec'/> Decisão de processo<br><br>\n\
                    &nbsp<input type='radio' name='rbTipo-" + i + "' value='dado'/> Dados Existentes<br><br>\n\
                    <div class='btn-default' id='tip'>Alterar</div> <div class='btn-default' id='cancel'>Cancelar</div>");
                    $('[name=rbTipo-' + i + '][value=' + atvs[i].tipo + ']').attr('checked', true);
                }
                if (acao === "rem") {
                    for (var j in atvs) {
                        for (var k in atvs[j].filhos) {
                            if (atvs[j].filhos[k] === atvs[i].nome) {
                                atvs[j].filhos.splice(k, 1);
                            }
                        }
                    }
                    atvs.splice(i, 1);
                }
                if (acao === "info") {
                    $('#dir').html("<h4 align='center'>Informações da Atividade</h4>"
                            + "&nbspNome: " + atvs[i].nome + "<br>"
                            + "&nbspDescrição: " + atvs[i].desc + "<br>"
                            + "&nbspVínculos: " + (atvs[i].filhos !== '' ? atvs[i].filhos : 'nenhum') + "<br>"
                            + "&nbspTipo: " + atvs[i].tipo + "<br>");
                }
            }
        }
        if ($(event.target).prop('id') === '') {
            if (inicio === null) {
                if (acao === "add") {
                    atvs.push({x: event.clientX - window.innerWidth * 0.105, y: event.clientY - 100, nome: "a" + id, desc: "atv" + id, filhos: [], raiz: true, tipo: "proc"});
                    id = id + 1;
                }
            } else {
                inicio = null;
                setado = false;
            }
        }
        update(event);
    })
            .mousemove(function (event) {
                if (inicio !== null) {
                    update(event);
                }
            });

    //FUNÇÃO ATUALIZAR
    function update(event) {
        R.clear();
        //DESENHAR BLOCOS
        for (var i in atvs) {
            if (atvs[i].tipo === "ter") {
                R.ellipse(atvs[i].x, atvs[i].y, 30, 25, 5).attr({fill: "#F00000", stroke: "black", opacity: .5, cursor: "pointer"})
                        .node.setAttribute('id', atvs[i].nome);
            }
            if (atvs[i].tipo === "proc") {
                R.rect(atvs[i].x - 30, atvs[i].y - 25, 60, 50, 10).attr({fill: "#0000FF", stroke: "black", opacity: .5, cursor: "pointer"})
                        .node.setAttribute('id', atvs[i].nome);
            }
            if (atvs[i].tipo === "doc") {
                R.rect(atvs[i].x - 30, atvs[i].y - 25, 60, 50, 10).attr({fill: "#9999FF", stroke: "black", opacity: .5, cursor: "pointer"})
                        .node.setAttribute('id', atvs[i].nome);
            }
            if (atvs[i].tipo === "dec") {
                R.rect(atvs[i].x - 20, atvs[i].y - 20, 40, 40, 10).attr({fill: "#999900", stroke: "black", opacity: .5, cursor: "pointer"})
                        .transform("r45")
                        .node.setAttribute('id', atvs[i].nome);
            }
            if (atvs[i].tipo === "dado") {
                R.ellipse(atvs[i].x, atvs[i].y, 30, 25, 5).attr({fill: "#336600", stroke: "black", opacity: .5, cursor: "pointer"})
                        .node.setAttribute('id', atvs[i].nome);
            }
            R.text(atvs[i].x, atvs[i].y, atvs[i].desc)
                    .attr({"font-size": "12px", stroke: "white", "stroke-width": "1px", cursor: "pointer"})
                    .node.firstChild.setAttribute('id', atvs[i].desc);
        }
        //DESENHAR SETAS
        for (var i in atvs) {
            if (atvs[i].filhos !== "") {
                //ACHAR FILHOS
                for (var j = 0; j < atvs[i].filhos.length; j++) {
                    for (var k = 0; k < atvs.length; k++) {
                        if (atvs[i].filhos[j] === atvs[k].nome) {
                            var ini = ancorar(atvs[i], atvs[k]);
                            var fim = ancorar(atvs[k], atvs[i]);
                            var linha = "M " + ini.x + "," + ini.y + " L " + fim.x + "," + fim.y;
                            R.path(linha).attr({stroke: "gray", 'stroke-width': 2, 'arrow-end': 'classic-wide-long'});
                            break;
                        }
                    }
                }
            }
        }
        if (setado) {
            //ancoragem da linha
            var fim = {x: event.clientX - window.innerWidth * 0.105 - 10, y: event.clientY - 90};
            var ini = ancorar(inicio, fim);
            var linha = "M " + ini.x + "," + ini.y + " L " + fim.x + "," + fim.y;
            R.path(linha).attr({stroke: "gray", 'stroke-width': 2, 'arrow-end': 'classic-wide-long'});
        }
    };

    //analise de regras (sequência correta)
    function regras(temp) {
        validar = false;
        //localizar os dados
        var current;
        for (var i in atvs) {
            if (temp[0] === atvs[i].nome) {
                temp.splice(0, 1);
                current = atvs[i];
                break;
            }
        }
        //verificar se a sequencia é alcançável na ordem
        while (temp.length > 0) {
            for (var i in atvs) {
                if (temp[0] === atvs[i].nome) {
                    temp.splice(0, 1);
                    validar = true;
                    verificar(atvs[i], current);
                    alert(atvs[i].nome + "," + current.nome + "=" + validar);
                    current = atvs[i];
                    break;
                }
            }
            if (validar) {
                break;
            }
        }
        return !validar;
    }
    //analise de percurso do nó  (se alvo1 é alcançável pelo alvo2)
    function verificar(alvo1, alvo2) {
        if (alvo1.nome === alvo2.nome) {
            validar = false;
        }
        if (validar) {
            if (alvo2.filhos !== "") {
                for (var i in alvo2.filhos) {
                    for (var j in atvs) {
                        if (alvo2.filhos[i] === atvs[j].nome) {
                            verificar(alvo1, atvs[j]);
                            break;
                        }
                    }
                }
            }
        }
    }
    //Ancoragem da linha
    function ancorar(i, f) {
        var dx = f.x - i.x;
        var dy = f.y - i.y;
        var x = 0, y = 0;
        if (dx > 0 && dy > 0) {
            if (dx > dy) {
                x = i.x + 30;
                y = i.y;
            } else {
                x = i.x;
                y = i.y + 25;
            }
        } else if (dx > 0 && dy <= 0) {
            if (dx > -1 * dy) {
                x = i.x + 30;
                y = i.y;
            } else {
                x = i.x;
                y = i.y - 25;
            }
        } else if (dx <= 0 && dy > 0) {
            if (-1 * dx > dy) {
                x = i.x - 30;
                y = i.y;
            } else {
                x = i.x;
                y = i.y + 25;
            }
        } else if (dx <= 0 && dy <= 0) {
            if (-1 * dx > -1 * dy) {
                x = i.x - 30;
                y = i.y;
            } else {
                x = i.x;
                y = i.y - 25;
            }
        }
        var ancora = {x: x, y: y};
        return ancora;
    }

    //Contador de folhas (sem uso)
    function contarfolhas(no) {
        var folha = true;
        //verificar se é folha
        if (no.filhos !== "") {
            folha = false;
            //selecionar filhos
            for (var i = 0; i < no.filhos.length; i++) {
                // verificar filhos
                for (var j = 0; j < atvs.length; j++) {
                    if (no.filhos[i] === atvs[j].nome) {
                        contarfolhas(atvs[j]);
                    }
                }
            }
        }
        if (folha === true) {
            nfolhas += 1;
        }
    }
});