-- ЗАПУСКАТЬ ПОЗЖЕ, вручную, убедившись что новая версия сайта работает.
-- Убирает колонки старой модели «классов». После 0003 их никто не читает.
alter table books drop column if exists grade;
alter table students drop column if exists grade;
