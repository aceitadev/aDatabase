# aDatabase ORM

ORM em typescript focada no padrao Active Record para MySQL e PostgreSQL. Prove inicializacao unificada, mapeamento por decorators, ActiveRecord com save/delete, QueryBuilder fluente e um SchemaManager que gera tabelas a partir dos modelos.

## Sumario

- [Instalacao](#instalacao)
- [Inicializacao do banco](#inicializacao-do-banco)
- [Definindo modelos](#definindo-modelos)
  - [Decorators](#decorators)
- [Persistencia com ActiveRecord](#persistencia-com-activerecord)
  - [Transacoes](#transacoes)
- [Consultas com QueryBuilder](#consultas-com-querybuilder)
  - [Carregando relacoes](#carregando-relacoes)
- [Migracoes com SchemaManager](#migracoes-com-schemamanager)
- [Adapters](#adapters)
- [Tratamento de erros](#tratamento-de-erros)
- [Limitacoes conhecidas](#limitacoes-conhecidas)
- [Utilidades](#utilidades)
- [Licenca](#licenca)

## Instalacao

```bash
npm install @aceitadev/adatabase

# escolha o driver do banco
npm install mysql2        # para MySQL ou MariaDB
npm install pg            # para PostgreSQL
```

## Inicializacao do banco

```	ts
import { init } from '@aceitadev/adatabase@latest';

init('mysql', {
  host: '127.0.0.1',
  user: 'root',
  password: 'secret',
  database: 'app_db',
  connectionLimit: 10,
});

init('postgres', {
  url: 'postgres://user:pass@localhost:5432/app_db',
});
```

Chame closePool() ao encerrar a aplicacao para desmontar o pool de conexoes.

## Definindo modelos

Cada tabela corresponde a uma classe que estende ActiveRecord.

```	ts
import {
  ActiveRecord,
  Table,
  Id,
  Column,
  Nullable,
  HasMany,
  BelongsTo,
} from '@aceitadev/adatabase';

@Table('users')
export class User extends ActiveRecord {
  @Id()
  id!: number;

  @Column({ type: String, limit: 120 })
  name!: string;

  @Column({ type: String, unique: true })
  email!: string;

  @HasMany(() => Post, { foreignKey: 'userId' })
  posts?: Post[];
}

@Table('posts')
export class Post extends ActiveRecord {
  @Id()
  id!: number;

  @Column({ type: String })
  title!: string;

  @Column({ type: String })
  body!: string;

  @Column({ type: Number })
  userId!: number;

  @BelongsTo(() => User, { foreignKey: 'userId' })
  user?: User;
}
```

### Decorators

- @Table(name) define o nome da tabela.
- @Id() marca a chave primaria auto incremental (SERIAL no PostgreSQL).
- @Column({ type, name, limit, unique, index, decimal }) configura a coluna:
  - type: String, Number, Boolean ou Date.
  - name: nome da coluna (padrao: camelCase vira snake_case).
  - limit: largura para VARCHAR.
  - unique: cria restricao unica.
  - index: indica criacao de indice simples.
  - decimal: 	rue para DECIMAL(10,2) ou [precision, scale].
- @Nullable() permite NULL.
- @HasMany, @HasOne, @BelongsTo definem relacoes. O campo foreignKey precisa estar decorado com @Column no modelo correspondente.

> ColumnOptions.adapter existe mas ainda nao e aplicado durante save ou QueryBuilder.

## Persistencia com ActiveRecord

```ts
const user = new User();
user.name = 'Ada Lovelace';
user.email = 'ada@example.com';

await user.save();      // INSERT

user.name = 'Ada L.';
await user.save();      // UPDATE pois id ja foi definido

await user.delete();    // DELETE
```

### Transacoes

Passe a conexao para reutilizar uma transacao.

```ts
import { getConnection } from '@aceitadev/adatabase';

const conn = await getConnection();
try {
  await conn.query('START TRANSACTION');
  await user.save(conn);
  await post.save(conn);
  await conn.query('COMMIT');
} catch (err) {
  await conn.query('ROLLBACK');
  throw err;
} finally {
  conn.release();
}
```

save e delete lancam PersistenceException quando ha erro, preservando a causa original.

## Consultas com QueryBuilder

```ts
const users = await User.find()
  .orderBy('name', 'asc')
  .limit(20)
  .offset(0)
  .get();

const admin = await User.find()
  .where('email', '=', 'admin@example.com')
  .first();

const total = await User.find().count();
```

### Carregando relacoes

```ts
const posts = await Post.find()
  .include(User)
  .where('userId', '=', user.id)
  .orderBy('id', 'desc')
  .get();

posts[0].user?.email; // ja carregado pelo join
```

Limitacoes atuais:

- where aceita somente operadores simples com AND. OR, IN, IS NULL e LIKE com curingas preparados precisam de manutencao na biblioteca para funcionarem.
- Operadores e nomes de coluna nao passam pela validacao prevista em Security.ts; evite concatenar valores externos diretamente.

## Migracoes com SchemaManager

SchemaManager gera ou ajusta tabelas a partir dos modelos listados.

```ts
import { SchemaManager } from '@aceitadev/adatabase';

const schema = new SchemaManager([User, Post]);
await schema.migrate();
```

Comportamento atual:

- Cria a tabela completa se ela nao existir.
- Para tabelas existentes: adiciona colunas novas ou modifica tipos no MySQL.
- Indices marcados com index: true so sao criados automaticamente no MySQL durante a criacao inicial; para PostgreSQL ha tentativas de CREATE INDEX, porem o SQL ainda usa crases e precisa de ajuste.
- Nao remove colunas ou indices obsoletos.
- O comando MODIFY COLUMN usado para alteracoes nao existe no PostgreSQL, portanto a migracao falha nesse banco.

Recomenda-se revisar o log impresso para verificar quais alteracoes foram aplicadas.

## Adapters

- MySQLAdapter (mysql2/promise)
- PostgresAdapter (pg)

Utilize getAdapter() se precisar acessar diretamente o pool corrente.

## Tratamento de erros

Use PersistenceException para capturar erros gerados pelo ORM. Instancias guardam a mensagem original em cause e complementam a stack trace.

## Limitacoes conhecidas

- Identificadores de tabela nao sao protegidos quando ActiveRecord cria SQL; use nomes simples e confiaveis em @Table.
- QueryBuilder duplica entradas em arrays HasMany quando a consulta retorna varias linhas para o mesmo relacionamento.
- ColumnAdapter ainda nao executa serialize/deserialize.
- SchemaManager ignora remocao de colunas/indices e nao reexecuta criacao de indices faltantes em tabelas antigas.

## Utilidades

- closePool() encerra o pool.
- getConnection() retorna uma conexao/poolCliente reutilizavel.

## Licenca

MIT.
