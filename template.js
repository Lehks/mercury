class QueryBuilder {}

const result = QueryBuilder.select(User.ID)
    .from(table(User).naturalJoin(UserData))
    .where(
        and(
            UserData.DATA.equals(5),
            UserData.OTHER_DATA.equals('some string'),
            UserData.THIRD_DATA.in(
                select(AdditionalData.DATA)
                    .from(AdditionalData)
                    .where(AdditionalData.ID.gt(5))
            )
        )
    )
    .orderBy(User.ID, 'ascending')
    .limit(1)
    .execute();

// todo group by

User.naturalJoin(UserData);
User.join(UserData).on(User.USER_ID, UserData.USER_ID);

const updateResult = QueryBuilder.update(User)
    .set(User.DATA, 10)
    .set(User.THIRD_DATA, 'abc')
    .where(/* regular where stmt */);

const deleteResult = QueryBuilder.delete()
    .from(User)
    .where(/* regular where stmt */);

const user = User.findById(10);
user.id;
user.getData();
user.setData(10);

user.exists();

const otherUser = User.findById(15);
user.equals(otherUser);

const user = User.create({
    data: 12,
    otherData: null,
    thirdData: 15
});

const connectionManager = undefined;

const conn = connectionManager.defaultConnection;
conn.query('some sql');

const query = QueryBuilder.select(1).from(User);
conn.query(query);

conn.multiQuery(c => {
    c.query('some sql');
    c.query(query);
});

conn.transaction(c => {
    c.query('some sql');
    c.query(query);
});
