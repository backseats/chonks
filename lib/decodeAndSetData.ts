import { Chonk } from "@/types/Chonk";
export function decodeAndSetData(data: string, setData: (data: Chonk) => void) {

    console.log("data::decodeAndSetData", data);

    let jsonData: Chonk;
    // will be if 2d: data:application/json;base64,eyJ
    // will be if not 3d: data:application/json,%7B%22name%22%3A%22Chonk%20%2316760%22%2C%20%22description%22%3A%22%5BView%20Chonk%20on%20the%20Cho

    if (data.includes("data:application/json;base64,")) {
      const base64String = data.split(",")[1];
      const jsonString = atob(base64String);
      jsonData = JSON.parse(jsonString) as Chonk;
    } else {
      const urlEncodedJsonString = data.split(",")[1];
      const jsonString = decodeURIComponent(urlEncodedJsonString);
      jsonData = JSON.parse(jsonString) as Chonk;
    }
    // console.log("jsonData", jsonData);
    setData(jsonData);
  }
