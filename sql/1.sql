alter table tracksPlayed modify column djID char(36) NOT NULL;
alter table roboCoinAudit modify column users_id char(36)  NOT NULL;
alter table users modify column id char(36)  NOT NULL;
alter table videoData modify column id char(13) NOT NULL;