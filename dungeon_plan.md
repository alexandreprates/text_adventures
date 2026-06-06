# Dungeon

## Especificação

A dungeon deve ser construida aleatoriamente de acordo com a exploração do usuário sendo composta por _blocos_ de corredores pré definidos.

Existem 9 tipos de _blocos_ de corredores que podem ser usados conforme o descrito abaixo

* corredor saida direita

```
######
######
##  
######
######
```


* corredor saida esquerda

```
######
######
    ##
######
######
```

* corredor saida abaixo

```
######
######
##  ##
##  ##
##  ##
```


* corredor saida acima

```
##  ##
##  ##
##  ##
######
######
```


* corredor quatro saidas
```
##  ##
##  ##
        
##  ##
##  ##
```


* corredor saida canto 1

```
##  ##
##  ##
    ##
######
######
```


* corredor saida canto 2

```
##  ##
##  ##
##    
######
######
```

* corredor saida canto 3

```
######
######
    ##
##  ##
##  ##
```

* corredor saida canto 4

```
######
######
##  
##  ##
##  ##
```

## Movimentação

O mapa deve ser revelado conforme o jogador for se movimentando, obrigatoriamente mantendo a conexao com os corredores já revelados

### Exemplo:

_bloco_ inicial

```
######
######
## x 
######
######
```

Caso o jogador avance dois passos a direita um novo _bloco_ é exibido dando continuidade a dungeon

```
############
############
##    x
########  ##
########  ##
```

Caso o jogador avançe para a direita e depois abaixo um novo _bloco_ deve ser exibido

```
############
############
##    
########  ##
########  ##
      ## x##
      ##  ##
            
      ##  ##
      ##  ##
```

## Regras de construção

A dungeon não deve ser criada inteira no início da partida. Ela deve crescer de
forma incremental conforme o jogador explora. O estado persistente da dungeon
deve guardar os _blocos_ já revelados e a posição atual do jogador dentro do
mapa global.

Cada _bloco_ deve possuir:

* um identificador único;
* uma matriz fixa de tiles;
* uma lista de saídas disponíveis;
* pontos de entrada correspondentes a cada saída;
* peso opcional para sorteio;
* metadados opcionais de dificuldade, bioma ou tipo de encontro.

Exemplo conceitual:

```yaml
right_exit:
  exits:
    - right
  tiles:
    - "######"
    - "######"
    - "##    "
    - "######"
    - "######"
```

### Tiles

Os tiles básicos são:

* `#` parede;
* espaço em branco corredor/chão caminhável;
* `x` jogador, apenas no momento de renderização.

O `x` não deve ser salvo dentro dos blocos. A posição do jogador deve ser um
estado separado, renderizado sobre o mapa já composto.

### Tamanho dos blocos

Os exemplos usam blocos de 6 colunas por 5 linhas. A implementação deve assumir
um tamanho fixo de bloco para simplificar o encaixe:

```text
BLOCK_WIDTH = 6
BLOCK_HEIGHT = 5
```

Caso futuramente existam blocos de tamanho variável, o algoritmo de composição
deve ser revisado.

## Direções e conexões

As direções válidas são:

* `up`
* `right`
* `down`
* `left`

Cada direção possui uma direção oposta:

```text
up    -> down
right -> left
down  -> up
left  -> right
```

Quando o jogador sai de um bloco por uma direção ainda não revelada, o novo
bloco escolhido obrigatoriamente deve possuir a saída oposta.

Exemplos:

* jogador sai pela direita: o novo bloco precisa ter saída para a esquerda;
* jogador sai por baixo: o novo bloco precisa ter saída para cima;
* jogador sai pela esquerda: o novo bloco precisa ter saída para a direita;
* jogador sai por cima: o novo bloco precisa ter saída para baixo.

Essa regra garante que todos os blocos revelados permaneçam conectados.

## Coordenadas

A dungeon pode ser representada em dois sistemas de coordenadas:

### Coordenadas de bloco

Indicam onde cada bloco está no grid lógico da dungeon.

Exemplo:

```text
(0, 0) bloco inicial
(1, 0) bloco à direita do inicial
(1, 1) bloco abaixo do bloco à direita
```

### Coordenadas globais de tile

Indicam a posição real do jogador no mapa renderizado.

Para converter coordenadas de bloco em coordenadas globais:

```text
global_x = block_x * BLOCK_WIDTH + local_x
global_y = block_y * BLOCK_HEIGHT + local_y
```

O mapa renderizado deve considerar todos os blocos revelados e calcular os
limites mínimos e máximos de `block_x` e `block_y`. Isso permite que a dungeon
cresça para esquerda e para cima sem quebrar a renderização.

## Estado da dungeon

O estado mínimo da dungeon deve conter:

* nível atual da dungeon;
* seed ou objeto de randomização;
* blocos revelados por coordenada;
* posição atual do jogador em coordenadas globais ou em par bloco/local;
* histórico opcional de movimentos;
* encontros ativos ou pendentes, quando existir integração com combate.

Exemplo conceitual:

```ruby
revealed_blocks = {
  [0, 0] => :right_exit,
  [1, 0] => :corner_down_left,
  [1, 1] => :four_exits
}

player_position = {
  block: [1, 1],
  local: [3, 2]
}
```

## Algoritmo de movimento

Quando o jogador tenta se mover:

1. Calcular o próximo tile dentro do mapa global.
2. Se o tile existir e for caminhável, mover o jogador.
3. Se o próximo tile sair por uma abertura de borda de um bloco:
   * calcular a coordenada do bloco vizinho;
   * se o bloco vizinho já foi revelado, mover para ele;
   * se o bloco vizinho ainda não foi revelado, gerar um novo bloco compatível;
   * posicionar o jogador no tile correspondente do novo bloco.
4. Se o próximo tile for parede, impedir o movimento.
5. Após movimento válido, renderizar o mapa atualizado.
6. Opcionalmente, rolar encontro aleatório.

## Escolha de novos blocos

Ao revelar um novo bloco:

1. Determinar a direção de entrada no novo bloco.
2. Filtrar todos os blocos que possuem essa direção em `exits`.
3. Remover candidatos que criariam conexões incompatíveis com blocos já
   revelados ao redor.
4. Aplicar pesos de sorteio, se existirem.
5. Sortear o bloco.
6. Registrar o bloco na coordenada vizinha.

### Compatibilidade com vizinhos já revelados

Se o novo bloco for colocado ao lado de outros blocos já revelados, suas saídas
precisam ser compatíveis com esses vizinhos.

Regra:

* se o novo bloco tem saída para um vizinho existente, o vizinho precisa ter a
  saída oposta;
* se o vizinho existente tem saída para o novo bloco, o novo bloco precisa ter a
  saída oposta;
* se nenhum dos dois possui saída entre si, a borda deve permanecer fechada por
  parede.

Essa validação evita corredores quebrados ou saídas que apontam para paredes.

## Pontos de entrada

Cada saída deve ter um ponto de entrada/saída em coordenadas locais. Nos blocos
atuais, as aberturas parecem centralizadas:

* esquerda/direita usam a linha central;
* cima/baixo usam colunas centrais.

Para blocos 6x5, uma convenção possível é:

```text
left  -> local x 0, y 2
right -> local x 5, y 2
up    -> local x 2 ou 3, y 0
down  -> local x 2 ou 3, y 4
```

Como alguns corredores têm largura de dois tiles, a implementação deve escolher
um dos dois tiles centrais como posição principal do jogador, mantendo o outro
como chão caminhável.

## Renderização

O render deve compor todos os blocos revelados em uma única matriz.

Passos:

1. Encontrar `min_block_x`, `max_block_x`, `min_block_y` e `max_block_y`.
2. Criar uma matriz vazia grande o suficiente para todos os blocos revelados.
3. Copiar os tiles de cada bloco para sua posição global.
4. Renderizar o jogador (`x`) sobre a matriz composta.
5. Retornar as linhas como texto.

Quando existirem blocos com coordenadas negativas, o render deve aplicar um
offset para que os índices da matriz fiquem sempre positivos.

## Encontros

Encontros não fazem parte da estrutura dos blocos, mas podem ser acionados após
movimentos válidos. A chance de encontro pode considerar:

* nível da dungeon;
* quantidade de blocos revelados;
* tipo do bloco;
* bioma;
* distância do bloco inicial.

Inicialmente, a regra atual de chance fixa pode continuar sendo usada.

## Condições de parada e loops

A dungeon pode crescer indefinidamente, mas a implementação deve considerar
limites opcionais:

* máximo de blocos revelados por nível;
* chance de gerar escadas para o próximo nível;
* chance de gerar sala especial;
* chance de gerar beco sem saída;
* prevenção de loops incompatíveis.

Mesmo quando loops forem permitidos, toda conexão deve respeitar a regra de
compatibilidade entre saídas opostas.

## Estratégia de implementação sugerida

1. [x] Extrair os 9 blocos para um catálogo de blocos.
2. [x] Representar cada bloco com `tiles` e `exits`.
3. [x] Substituir o mapa fixo atual por uma coleção de blocos revelados.
4. [x] Implementar renderização de múltiplos blocos.
5. [x] Implementar movimento dentro de um bloco.
6. [x] Implementar revelação de bloco ao cruzar uma saída válida.
7. [x] Implementar validação de compatibilidade com vizinhos.
8. [x] Manter a lógica de encontros após movimentos válidos.
9. Adicionar testes para:
   * render do bloco inicial;
   * movimento interno;
   * revelação para direita;
   * revelação para baixo;
   * tentativa de atravessar parede;
   * conexão obrigatória entre blocos;
   * render com coordenadas negativas.
