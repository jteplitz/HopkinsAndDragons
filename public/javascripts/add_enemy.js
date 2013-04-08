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
    var rowHtml = ["<tr>",
                   '<td><input class="attack_name" type="text"></td>',
                   '<td><input class="hit_percent" type="number"></td>',
                   '<td><input class="min_damage" type="number"></td>',
                   '<td><input class="max_damage last" type="number"></td>',
                   "</tr"];
    $(".max_damage.last").removeClass("last");
    $("#enemyForm table.attacks tbody").append(rowHtml.join(""));
  };

  prepEnemy= function(){
    var attack = {
      name: $("#attack_name").val(),
      min_damage: $("#min_damage").val(),
      max_damage: $("#max_damage").val(),
      hit_chance: $("#hit_percent").val()
    };

    //$(".attacks").append("<li>
  };
}());
