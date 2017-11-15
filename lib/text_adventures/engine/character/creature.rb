class TextAdventures::Engine::Character::Creature < TextAdventures::Engine::Character

  def loot
    return false unless dead?
    [:junk, :flur, :key].sample
  end

end
