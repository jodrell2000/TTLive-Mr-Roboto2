alter table tracksPlayed modify column djID char(36) NOT NULL;
alter table roboCoinAudit modify column users_id char(36)  NOT NULL;
alter table users modify column id char(36)  NOT NULL;
alter table videoData modify column id char(36) NOT NULL;
alter table tracksPlayed modify column videoData_id char(36) NOT NULL;

ALTER TABLE videoData add column youTubeID char(16) DEFAULT NULL,
    add column appleID char(16) DEFAULT NULL,
    add column spotifyID char(36) DEFAULT NULL;

ALTER TABLE tracksPlayed DROP COLUMN artistID,
    DROP COLUMN trackID;

ALTER TABLE tracksPlayed ADD COLUMN playedLength INT UNSIGNED DEFAULT 0;

CREATE TABLE persistentMemory (
    theKey char(32) PRIMARY KEY,
    theValue TEXT
);


SELECT tp.id, tp.whenPlayed,
u.username,
tp.upvotes, tp.downvotes, tp.snags,
COALESCE(vd.artistName, vd.artistName) AS Artist,
COALESCE(vd.trackName, vd.trackName) AS Track,
vd.id,
GROUP_CONCAT(c.command, e.count) AS Commands
FROM
tracksPlayed tp
JOIN videoData vd ON tp.videoData_id = vd.id
JOIN users u ON u.id=tp.djID
LEFT JOIN extendedTrackStats e ON e.tracksPlayed_id=tp.id
JOIN commandsToCount c ON e.commandsToCount_id = c.id
GROUP BY tp.id
ORDER BY tp.id DESC
LIMIT 10;

SELECT tp.id, tp.whenPlayed, u.username, tp.upvotes, tp.downvotes, tp.snags, COALESCE(vd.artistName, vd.artistName) AS 
    Artist, COALESCE(vd.trackName, vd.trackName) AS Track, vd.id, GROUP_CONCAT(c.command, e.count) FROM tracksPlayed tp JOIN videoData vd ON tp.videoData_id = vd.id JOIN users u ON u.id=tp.djID LEFT JOIN extendedTrackStats e ON e.tracksPlayed_id=tp.id LEFT JOIN commandsToCount c ON e.commandsToCount_id = c.id GROUP BY tp.id ORDER BY tp.id DESC LIMIT 10;

id: 826
       whenPlayed: 2024-06-12 10:45:40
             djID: f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc
          upvotes: 0
        downvotes: 0
            snags: 0
           length: 341
     videoData_id: Ev3wH-yK8k
     playedLength: 0
               id: Ev3wH-yK8k
       artistName: Pearl Jam
        trackName: Alive
artistDisplayName: NULL
 trackDisplayName: NULL
        youTubeID: NULL
          appleID: i.aD0lFg2Pbe
        spotifyID: NULL
