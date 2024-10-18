// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

library TraitCategory {

    // TODO: add bg as a trait?
    enum Name {
        None, // 0
        Hat, // 1
        Hair, // 2
        Face, // 3
        Accessory, // 4
        Top, // 5
        Bottom, // 6
        Shoes // 7
    }

    function toString(Name name) public pure returns (string memory) {
        if (name == Name.Hat) return "Head";
        if (name == Name.Hair) return "Hair";
        if (name == Name.Face) return "Face";
        if (name == Name.Accessory) return "Accessory";
        if (name == Name.Top) return "Top";
        if (name == Name.Bottom) return "Bottom";
        if (name == Name.Shoes) return "Shoes";
        return "";
    }

}
