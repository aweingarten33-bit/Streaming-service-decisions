import { describe, expect, test } from "bun:test";
import { parseImdbCsv } from "@/lib/marquee/imdb-csv";

describe("parseImdbCsv", () => {
  test("parses IMDb's real export column names", () => {
    const csv = [
      "Const,Your Rating,Date Rated,Title,URL,Title Type,Year",
      "tt0111161,,,The Shawshank Redemption,https://imdb.com/title/tt0111161,movie,1994",
      "tt0903747,,,Breaking Bad,https://imdb.com/title/tt0903747,tvSeries,2008",
    ].join("\n");

    const rows = parseImdbCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      imdbId: "tt0111161",
      title: "The Shawshank Redemption",
      year: 1994,
      typeHint: "movie",
    });
    expect(rows[1].typeHint).toBe("tv");
  });

  test("degrades gracefully for a CSV with only a title column (e.g. a generic export)", () => {
    const csv = "Title,Year\nInception,2010";
    const rows = parseImdbCsv(csv);
    expect(rows).toEqual([{ imdbId: null, title: "Inception", year: 2010, typeHint: null }]);
  });

  test("ignores a malformed IMDb id and keeps the title", () => {
    const csv = "Const,Title\nnot-an-id,Some Movie";
    const rows = parseImdbCsv(csv);
    expect(rows[0].imdbId).toBeNull();
    expect(rows[0].title).toBe("Some Movie");
  });

  test("returns an empty array for an empty file", () => {
    expect(parseImdbCsv("")).toEqual([]);
  });

  test("handles quoted titles containing commas", () => {
    const csv = 'Const,Title,Year\ntt0068646,"Godfather, The",1972';
    const rows = parseImdbCsv(csv);
    expect(rows[0].title).toBe("Godfather, The");
  });
});
