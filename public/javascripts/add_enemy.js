(function(){
  "use strict";

  // functions
  var addAttack, prepEnemy;
  
  $(document).ready(function(){
    //$(".max_damage.last").change(addAttack);
    $("table.attacks").on("change", ".max_damage.last", addAttack);
    $("#enemyForm").submit(prepEnemy);
  });

  addAttack = function(e){
    var rowHtml = ["<tr class='attack'>",
                   '<td><input class="attack_name" type="text"></td>',
                   '<td><input class="hit_percent" type="number"></td>',
                   '<td><input class="min_damage" type="number"></td>',
                   '<td><input class="max_damage last" type="number"></td>',
                   "</tr"];
    $(".max_damage.last").removeClass("last");
    $("#enemyForm table.attacks tbody").append(rowHtml.join(""));
  };

  prepEnemy= function(){
    var attacks = $("tr.attack"), attacksData = [];

    for (var i = 0; i < attacks.length; i++){
      var attack = attacks[i];
      attacksData.push({
        name: $(attack).find(".attack_name").val(),
        hit_percent: $(attack).find(".hit_percent").val(),
        min_damage: $(attack).find(".min_damage").val(),
        max_damage: $(attack).find(".max_damage").val()
      });
    }

    attacksData = JSON.stringify(attacksData);
    var attacksInput = $("<input type='hidden' name='attacks'>");
    attacksInput.val(attacksData);
    $("#enemyForm").append(attacksInput);
  };
}());
