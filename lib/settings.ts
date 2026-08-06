export const ITEM_PER_PAGE = 10;

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/home(.*)": ["admin", "lecturer", "student"],
  "/list/buildings": ["admin"],
  "/list/lecture_rooms": ["admin"],
  "/list/departments": ["admin"],
  "/list/subjects": ["admin", "lecturer", "student"],
  "/list/lecturers": ["admin", "lecturer", "student"],
  "/list/reservations": ["admin", "lecturer"],
  "/gpa": ["student"],
  "/upcoming": ["student"],
};
