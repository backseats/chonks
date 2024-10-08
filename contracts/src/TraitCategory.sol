// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

library TraitCategory {

    // TODO: add bg as a trait?
    enum Name {
        Hat, // 0
        Hair, // 1
        Face, // 2
        Accessory, // 3
        Top, // 4
        Bottom, // 5
        Shoes // 6
    }

    function toString(Name name) public pure returns (string memory) {
        if (name == Name.Hat) return "Hat";
        if (name == Name.Hair) return "Hair";
        if (name == Name.Face) return "Face";
        if (name == Name.Accessory) return "Accessory";
        if (name == Name.Top) return "Top";
        if (name == Name.Bottom) return "Bottom";
        if (name == Name.Shoes) return "Shoes";
        return "";
    }

}
